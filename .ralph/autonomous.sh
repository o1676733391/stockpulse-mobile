#!/usr/bin/env bash
# ==============================================================================
# Ralph Autonomous QA & Engineering Loop for Expo / React Native
# Orchestrator: Gemini CLI + Maestro E2E Engine
# ==============================================================================

set -u

# Core Configuration
CONFIG_DIR=".ralph"
MATRIX_FILE="${CONFIG_DIR}/test_matrix.json"
REQS_FILE="${CONFIG_DIR}/customer_requirements.txt"
SESSION_ID=$(date +%Y%m%d_%H%M%S)
LOGS_DIR="./logs/${SESSION_ID}"
REPORT_FILE="TEST_REPORT.md"
MAX_RETRIES=4

mkdir -p "${CONFIG_DIR}" e2e "${LOGS_DIR}"

# ------------------------------------------------------------------------------
# 0. PRE-FLIGHT VERIFICATION
# ------------------------------------------------------------------------------
echo "=========================================================="
echo "▶ Phase 0: Verifying Environment & CLI Toolchains"
echo "=========================================================="

check_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "❌ Missing dependency: '$1' is required but not installed." >&2
    exit 1
  }
}

check_cmd gemini
check_cmd maestro
check_cmd jq
check_cmd adb
check_cmd git

# Verify active Android emulator or connected device
if ! adb devices | grep -E "emulator-[0-9]+|device$" >/dev/null 2>&1; then
  echo "❌ No active Android emulator/device detected via adb. Launch your emulator first."
  exit 1
fi

echo "✅ All dependencies and target devices verified."

# ------------------------------------------------------------------------------
# 1. SEED SPECIFICATIONS & DISCOVERY
# ------------------------------------------------------------------------------
cat << 'EOF' > "${REQS_FILE}"
### CUSTOMER REQUIREMENTS SPECIFICATION
1. Inventory Sub-Menu Navigation:
   - Clicking "Inventory" opens an option picker with: "Inventory", "Invoices", and "Delivery notes".
   - Seamless routing into the respective sub-screens.
2. Admin Invoice & Delivery Note Management:
   - For Invoices and Delivery notes, Admin users must be able to filter and create entries categorized by: Month, Year, and Dealer.
3. i18n & Language Settings Audit:
   - Audit all screens for hardcoded UI strings and lingering secondary languages.
   - Refactor hardcoded strings to use existing i18n hooks/dictionaries. Ensure localized consistency.
4. Articles -> Recourse Dealer Link:
   - Under "Articles -> Recourse", list products properly.
   - Place a direct link from orders navigating directly to the associated Dealer details.
5. Stock Auto-Increment:
   - When new products are added via a Delivery note, increment the current stock quantity in the inventory.
EOF

if [ ! -f "$MATRIX_FILE" ]; then
  echo "=========================================================="
  echo "▶ Phase 1: Scanning Codebase & Synthesizing Test Matrix"
  echo "=========================================================="

  CONTEXT_TMP="${LOGS_DIR}/codebase_context.tmp"
  
  echo "=== FILE STRUCTURE (src/) ===" > "$CONTEXT_TMP"
  find src -maxdepth 3 -type f \( -name "*.tsx" -o -name "*.ts" \) | sort >> "$CONTEXT_TMP" 2>/dev/null || true
  echo "" >> "$CONTEXT_TMP"

  echo "=== NAVIGATION & ROUTING ===" >> "$CONTEXT_TMP"
  find src/navigation -type f \( -name "*.tsx" -o -name "*.ts" \) -exec echo "--- {} ---" \; -exec cat {} \; >> "$CONTEXT_TMP" 2>/dev/null || true
  echo "" >> "$CONTEXT_TMP"

  echo "=== CONTEXT & AUTH ROLES ===" >> "$CONTEXT_TMP"
  find src/context -type f \( -name "*.tsx" -o -name "*.ts" \) -exec echo "--- {} ---" \; -exec cat {} \; >> "$CONTEXT_TMP" 2>/dev/null || true
  echo "" >> "$CONTEXT_TMP"

  echo "=== CUSTOMER SPECIFICATIONS ===" >> "$CONTEXT_TMP"
  cat "${REQS_FILE}" >> "$CONTEXT_TMP"

  echo "🤖 Prompting Gemini CLI to synthesize .ralph/test_matrix.json..."

  gemini prompt "You are an autonomous Senior React Native Engineer & QA Automation Lead.
Inspect this Expo codebase layout and feature requirements:

$(cat "$CONTEXT_TMP")

Generate a structured test matrix as a RAW JSON Array without markdown fences:
Include:
- 5 'Customer_Feature' tasks mapped to specific source files based on the customer requirements.
- 'Regression_Sweep' tasks for all discovered routes and roles (Guest, Staff, Admin).

JSON Array Schema:
[
  {
    \"id\": \"UNIQUE_ID\",
    \"category\": \"Customer_Feature\" | \"Regression_Sweep\",
    \"role\": \"Guest\" | \"Staff\" | \"Admin\" | \"All\",
    \"feature\": \"Short title\",
    \"description\": \"Detailed user interaction flow\",
    \"acceptance_criteria\": [\"Criteria 1\", \"Criteria 2\"],
    \"target_files\": [\"src/path/to/File.tsx\"],
    \"test_file\": \"e2e/<unique_id>.yaml\",
    \"status\": \"pending\"
  }
]
Output valid JSON only." > "${LOGS_DIR}/matrix_raw.json"

  # Strip markdown formatting if returned
  sed '/^[[:space:]]*```/d' "${LOGS_DIR}/matrix_raw.json" > "$MATRIX_FILE"
  rm -f "$CONTEXT_TMP"

  if ! jq empty "$MATRIX_FILE" 2>/dev/null; then
    echo "❌ Failed to generate valid JSON in ${MATRIX_FILE}. Check ${LOGS_DIR}/matrix_raw.json"
    exit 1
  fi

  TOTAL_TASKS=$(jq '. | length' "$MATRIX_FILE")
  echo "✅ Matrix synthesized with ${TOTAL_TASKS} tasks -> ${MATRIX_FILE}"
else
  echo "ℹ️ Existing test matrix detected at ${MATRIX_FILE}. Continuing execution."
fi

# ------------------------------------------------------------------------------
# 2. AUTONOMOUS TEST -> FIX -> COMMIT LOOP
# ------------------------------------------------------------------------------
echo "=========================================================="
echo "▶ Phase 2: Starting Autonomous Ralph Execution Loop"
echo "=========================================================="

PENDING_TASKS=$(jq -r '.[] | select(.status=="pending") | .id' "$MATRIX_FILE")

if [ -z "$PENDING_TASKS" ]; then
  echo "🎉 No pending tasks found. All matrix tasks are completed or marked."
  exit 0
fi

for TASK_ID in $PENDING_TASKS; do
  ROLE=$(jq -r ".[] | select(.id==\"$TASK_ID\") | .role" "$MATRIX_FILE")
  FEATURE=$(jq -r ".[] | select(.id==\"$TASK_ID\") | .feature" "$MATRIX_FILE")
  CATEGORY=$(jq -r ".[] | select(.id==\"$TASK_ID\") | .category" "$MATRIX_FILE")
  TEST_FILE=$(jq -r ".[] | select(.id==\"$TASK_ID\") | .test_file" "$MATRIX_FILE")
  TARGET_FILES=$(jq -r ".[] | select(.id==\"$TASK_ID\") | .target_files | join(\" \")" "$MATRIX_FILE")
  AC=$(jq -r ".[] | select(.id==\"$TASK_ID\") | .acceptance_criteria | join(\"\n- \")" "$MATRIX_FILE")

  echo ""
  echo "----------------------------------------------------------"
  echo "▶ Processing [${TASK_ID}] (${CATEGORY}) | Role: ${ROLE}"
  echo "  Feature: ${FEATURE}"
  echo "----------------------------------------------------------"

  # Step 2a: Generate Maestro E2E YAML if absent
  if [ ! -f "$TEST_FILE" ]; then
    echo "🤖 [Gemini CLI] Generating Maestro YAML test: ${TEST_FILE}..."
    gemini prompt "You are a Mobile QA Automation Lead. Create a valid Maestro E2E test file (.yaml) for Expo React Native.
Feature: ${FEATURE}
Target Role: ${ROLE}
Acceptance Criteria:
- ${AC}

Target Files: ${TARGET_FILES}

REQUIREMENTS:
- Include appId and start with '- clearState' if clean state is required.
- Use robust assertions (assertVisible, tapOn, inputText, scrollUntilVisible).
- Do not output markdown code blocks. Output pure YAML." > "$TEST_FILE"
    
    sed -i '/^[[:space:]]*```/d' "$TEST_FILE"
  fi

  ATTEMPT=1
  TASK_PASSED=false

  # Step 2b: Execution & Self-Healing Loop
  while [ $ATTEMPT -le$MAX_RETRIES ]; do
    echo "  [Attempt ${ATTEMPT}/${MAX_RETRIES}] Executing: maestro test${TEST_FILE}"
    RUN_LOG="${LOGS_DIR}/${TASK_ID}_attempt_${ATTEMPT}.log"

    if maestro test "$TEST_FILE" > "$RUN_LOG" 2>&1; then
      echo "  ✅ PASS: Task [${TASK_ID}] passed successfully!"
      TASK_PASSED=true
      break
    else
      echo "  ❌ FAIL: Test failed. Capturing logs & triggering self-healing..."
      
      LOGCAT_LOG="${LOGS_DIR}/${TASK_ID}_logcat_attempt_${ATTEMPT}.log"
      adb logcat -d -s ReactNativeJS:V AndroidRuntime:E > "$LOGCAT_LOG" 2>/dev/null || true

      MAESTRO_TAIL=$(tail -n 40 "$RUN_LOG")
      LOGCAT_TAIL=$(tail -n 30 "$LOGCAT_LOG")

      echo "  🤖 [Gemini CLI] Analyzing stack trace and patching codebase..."
      
      gemini prompt "You are a Senior React Native Engineer operating autonomously.
Maestro E2E test failed on an Expo application:
Task: ${TASK_ID} - ${FEATURE} (Role:${ROLE})

MAESTRO LOG:
${MAESTRO_TAIL}

DEVICE LOGCAT:
${LOGCAT_TAIL}

MAESTRO TEST SCRIPT (${TEST_FILE}):
$(cat "$TEST_FILE" 2>/dev/null || true)

SOURCE CODE CONTEXT (${TARGET_FILES}):$(for f in $TARGET_FILES; do [ -f "$f" ] && echo "=== FILE: $f ===" && cat "$f"; done)

INSTRUCTIONS:
1. Identify the root cause (UI regression, unhandled exception, bad test selector, or missing i18n key).
2. Patch application code, navigation guards, or the test file directly to resolve the issue.
3. Ensure no existing flows are broken." --apply-patches

      # Atomic Git checkpoint commit for remediation
      if [ -n "$(git status --porcelain)" ]; then
        git add .
        git commit -m "fix(${TASK_ID}): resolve failure from Maestro attempt${ATTEMPT}"
        echo "  📦 [Git] Recorded commit: fix(${TASK_ID}): resolve failure from Maestro attempt${ATTEMPT}"
      fi

      ATTEMPT=$((ATTEMPT + 1))
    fi
  done

  # Step 2c: Update status & commit completion
  if [ "$TASK_PASSED" = true ]; then
    jq "(.[] | select(.id==\"$TASK_ID\") | .status) = \"completed\"" "$MATRIX_FILE" > "${MATRIX_FILE}.tmp" && mv "${MATRIX_FILE}.tmp" "$MATRIX_FILE"
    
    git add .
    git commit --allow-empty -m "feat(${TASK_ID}): verify and pass Maestro E2E test"
    echo "  🎉 [Git] Recorded commit: feat(${TASK_ID}): verify and pass Maestro E2E test"
  else
    echo "  ⚠️ Task [${TASK_ID}] failed after${MAX_RETRIES} attempts. Marking as blocked."
    jq "(.[] | select(.id==\"$TASK_ID\") | .status) = \"blocked\"" "$MATRIX_FILE" > "${MATRIX_FILE}.tmp" && mv "${MATRIX_FILE}.tmp" "$MATRIX_FILE"
  fi
done

# ------------------------------------------------------------------------------
# 3. REPORT GENERATION
# ------------------------------------------------------------------------------
echo "=========================================================="
echo "▶ Phase 3: Generating Final Verification Report"
echo "=========================================================="

COMPLETED=$(jq '[.[] \vert{} select(.status=="completed")] \vert{} length' "$MATRIX_FILE")
BLOCKED=$(jq '[.[] \vert{} select(.status=="blocked")] \vert{} length' "$MATRIX_FILE")
TOTAL=$(jq '. \vert{} length' "$MATRIX_FILE")

cat << EOF > "$REPORT_FILE"
# Autonomous QA Execution Summary

- **Execution Date:** $(date)
- **Session Logs:** \`${LOGS_DIR}\`
- **Total Matrix Tasks:** ${TOTAL}
- **Completed:** ${COMPLETED}
- **Blocked:** ${BLOCKED}

## Task Matrix Execution Status
| Task ID | Category | Role | Feature | Status |
| :--- | :--- | :--- | :--- | :--- |
$(jq -r '.[] \vert{} "\vert{} " + .id + " \vert{} " + .category + " \vert{} " + .role + " \vert{} " + .feature + " \vert{} " + .status + " \vert{}"' "$MATRIX_FILE")

## Recorded Commits
\`\`\`text
$(git log --oneline -n $((TOTAL * 2 + 5)))
\`\`\`
EOF

echo "📄 Report written to ${REPORT_FILE}"
echo "🏁 Execution cycle finished."