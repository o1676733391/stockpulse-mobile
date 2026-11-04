#!/usr/bin/env bash

set -e

PROMPT_TEMPLATE="gemini_feature_completion_prompt.md"
ERROR_LOG="gemini_errors.log"

SCAN_TARGETS=(
  "src/app"
  "src/components"
)

echo "=================================================="
echo "Starting Ralph: Feature Audit and Implementation"
echo "=================================================="

# if [ -n "$(git status --porcelain)" ]; then
#     echo "Warning: Working directory contains uncommitted changes. Please commit or stash first."
#     exit 1
# fi

for dir in "${SCAN_TARGETS[@]}"; do
    if [ ! -d "$dir" ]; then
        continue
    fi

    echo "Scanning directory: $dir"

    files=$(find "$dir" -maxdepth 3 -type f \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" \) | sort)

    for file_path in $files; do
        echo "--------------------------------------------------"
        echo "Auditing features in: $file_path"

        file_ext="${file_path##*.}"
        file_content=$(cat "$file_path")

        prompt=$(sed -e "s|{FILE_PATH}|$file_path|g" -e "s|{FILE_EXT}|$file_ext|g" "$PROMPT_TEMPLATE")
        prompt="${prompt//\{FILE_CONTENT\}/$file_content}"

        response=$(echo "$prompt" | gemini --model gemini-2.5-flash)

        if echo "$response" | grep -q "STATUS: NO_CHANGES"; then
            echo "All features verified: $file_path"
            continue
        fi

        commit_msg=$(echo "$response" | grep "COMMIT_MSG:" | head -n 1 | sed 's/COMMIT_MSG: //g')
        [ -z "$commit_msg" ] && commit_msg="feat($(basename "$file_path" | cut -d. -f1)): implement missing UI interactions"

        updated_code=$(echo "$response" | sed -n '/---CODE_START---/,/---CODE_END---/p' | sed '1d;$d')

        if [ -n "$updated_code" ]; then
            echo "$updated_code" > "$file_path"

            if git diff --quiet "$file_path"; then
                echo "No actual diff detected: $file_path"
            else
                echo "Feature implemented. Committing..."
                git add "$file_path"
                git commit -m "$commit_msg"
                echo "Committed: $commit_msg"
            fi
        else
            echo "Failed to parse code block for: $file_path"
            echo "--- ERROR AT $file_path ---" >> "$ERROR_LOG"
            echo "$response" >> "$ERROR_LOG"
        fi

        sleep 1
    done
done

echo "=================================================="
echo "Feature audit and implementation cycle completed."
echo "=================================================="