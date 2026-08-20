# StockPulse — AWS Production Infrastructure & Cloud Architecture

> **Version:** 1.0.0  
> **Target Cloud Provider:** Amazon Web Services (AWS)  
> **Infrastructure as Code (IaC):** AWS CDK (TypeScript) / Terraform  
> **Companion Document:** [BACKEND_ARCHITECTURE.md](file:///d:/Project%20Local/fnb-mobile/docs/architecture/BACKEND_ARCHITECTURE.md)

---

## 1. AWS Cloud Topology & Network Architecture

```mermaid
flowchart TB
    subgraph Internet [Public Internet]
        Users[StockPulse iOS & Android Mobile Clients]
    end

    subgraph AWS_Cloud [AWS Cloud Region: eu-central-1 / ap-southeast-1]
        R53[Route 53 DNS]
        CF[CloudFront CDN]
        WAF[AWS WAF]

        subgraph VPC [Custom VPC: 10.0.0.0/16 - 3 Availability Zones]
            subgraph Public_Subnets [Public Subnets - 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24]
                NAT[NAT Gateways x3]
                ALB[Application Load Balancer]
            end

            subgraph Private_App_Subnets [Private Compute Subnets - 10.0.10.0/22, 10.0.14.0/22, 10.0.18.0/22]
                ECS_Core[ECS Fargate Tasks: Core Services]
                Lambda_Workers[AWS Lambda Event Workers]
            end

            subgraph Isolated_DB_Subnets [Isolated Data Subnets - 10.0.20.0/24, 10.0.21.0/24, 10.0.22.0/24]
                RDS_Proxy[Amazon RDS Proxy]
                Aurora[(Aurora PostgreSQL Serverless v2)]
                Redis[(ElastiCache Redis 7.x Cluster)]
            end
        end

        subgraph AWS_Managed_Services [AWS Managed Platforms]
            S3_Receipts[(Amazon S3 Private Receipts Bucket)]
            S3_Audit[(Amazon S3 WORM Compliance Bucket)]
            EB[Amazon EventBridge Event Bus]
            SQS[Amazon SQS FIFO & Standard Queues]
            KMS[AWS Key Management Service CMK]
            SM[AWS Secrets Manager]
            CW[Amazon CloudWatch & X-Ray]
            OS[(Amazon OpenSearch Service)]
            Bedrock[Amazon Bedrock Claude 3.5 Sonnet / AI]
        end
    end

    Users --> R53 --> CF --> WAF --> ALB
    ALB --> ECS_Core
    ECS_Core --> RDS_Proxy --> Aurora
    ECS_Core --> Redis
    ECS_Core --> EB
    EB --> SQS --> Lambda_Workers
    Lambda_Workers --> Bedrock
    Lambda_Workers --> S3_Receipts
    ECS_Core -.->|KMS Encrypted| S3_Receipts
    ECS_Core --> CW
```

---

## 2. Infrastructure Sizing & Compute Specifications

### 2.1 ECS Fargate Task Sizing
| Service Tier | CPU Allocation | Memory Allocation | Base Tasks (Multi-AZ) | Peak Max Tasks | Scaling Metric Trigger |
|---|---|---|:---:|:---:|---|
| **API Core Gateway** | 0.5 vCPU | 1024 MB | 3 (1 per AZ) | 20 | CPU $> 60\%$ or Concurrent Reqs $> 500$ |
| **Inventory & BOM Engine** | 1.0 vCPU | 2048 MB | 3 (1 per AZ) | 20 | CPU $> 65\%$ or DB Conn $> 80\%$ |
| **Stock Count WebSocket** | 0.5 vCPU | 1024 MB | 2 (Multi-AZ) | 15 | Active WSS Connections $> 1000$ |
| **Procurement & Waste** | 0.5 vCPU | 1024 MB | 2 (Multi-AZ) | 8 | CPU $> 70\%$ |

### 2.2 Serverless Lambda Workers
| Worker Function | Memory | Timeout | Concurrency Limit | Invocation Source |
|---|---|---|---|---|
| `ocr-processing-worker` | 2048 MB (ARM64 Graviton) | 60s | 50 (Reserved) | SQS (`ocr-ingestion-queue.fifo`) |
| `push-notification-worker` | 512 MB (ARM64 Graviton) | 15s | 100 (Unreserved) | SQS (`push-dispatch-queue`) |
| `audit-cdc-streamer` | 512 MB (ARM64 Graviton) | 30s | 20 (Reserved) | Kinesis Data Stream |
| `bbd-daily-scheduler` | 256 MB (ARM64 Graviton) | 120s | 1 (Cron) | EventBridge Schedule (Daily 06:00) |

---

## 3. Database & Caching Specifications

### 3.1 Amazon Aurora PostgreSQL Serverless v2
- **Engine Version**: PostgreSQL 16.2
- **Capacity Range**: Min 0.5 ACU ($1\text{ GB RAM}$) to Max 32.0 ACUs ($64\text{ GB RAM}$).
- **High Availability**: Multi-AZ deployment with 1 Primary Writer and 1 Secondary Reader with auto-failover ($< 30\text{s}$).
- **Connection Management**: **Amazon RDS Proxy** enabled (max pool connections: 200) to eliminate connection spikes caused by Lambda concurrency.
- **Backup & Recovery**: Automated continuous backups with Point-In-Time-Recovery (PITR) up to 35 days, retained in S3 with cross-region replication.

### 3.2 Amazon ElastiCache Redis 7.x Cluster
- **Node Type**: `cache.t4g.medium` (ARM64 Graviton2, 3.09 GiB memory per node).
- **Cluster Topology**: 3 Shards across 3 Availability Zones with Multi-AZ automatic failover.
- **Eviction Policy**: `volatile-lru` (ensuring persistent token sessions and active count sessions are retained).

---

## 4. Storage, CDN & Edge Security

### 4.1 Amazon S3 Storage Buckets
```mermaid
flowchart LR
    Upload[Mobile Direct Upload] --> S3_Standard[S3 Standard: Receipts 0-90d]
    S3_Standard -->|Lifecycle Rule: 90d| S3_Glacier[S3 Glacier Instant: 90-365d]
    S3_Glacier -->|Lifecycle Rule: 365d| S3_Deep[S3 Glacier Flexible Archive: 1-7 yrs]
```

- **Bucket 1: `stockpulse-receipts-prod`**:
  - Purpose: POS scan images and delivery invoices.
  - SSE-KMS Customer Managed Key enabled.
  - CORS policy allowing `PUT` only from authorized mobile clients.
- **Bucket 2: `stockpulse-audit-compliance-prod`**:
  - Purpose: WORM compliance audit log archive.
  - **S3 Object Lock (Compliance Mode)** enabled with a 7-year legal hold.
- **Bucket 3: `stockpulse-static-assets-prod`**:
  - Purpose: App logos, dish thumbnails, and vector assets.
  - Fronted by CloudFront with Origin Access Control (OAC).

### 4.2 AWS WAF & CloudFront Edge Configuration
- **AWS Managed Rule Groups**:
  - `AWSManagedRulesCommonRuleSet` (OWASP Top 10 mitigation).
  - `AWSManagedRulesKnownBadInputsRuleSet` (SQL injection & XSS filtering).
  - `AWSManagedRulesAmazonIpReputationList` (Tor exit nodes & botnet blocking).
- **Rate-Limiting Rule**: Restricts IP addresses to max 1,000 requests per 5-minute window on public auth endpoints (`/auth/login`).

---

## 5. Asynchronous Messaging & Queue Architecture

```mermaid
flowchart LR
    subgraph Producers [Event Producers]
        API[Core API Services]
        S3_Event[S3 ObjectCreated]
        Cron_Event[EventBridge Scheduler]
    end

    subgraph EventBridge_Bus [Amazon EventBridge Custom Bus]
        Bus[stockpulse-events-bus]
    end

    subgraph SQS_Queues [Amazon SQS Queues]
        Q1[ocr-ingestion-queue.fifo]
        Q1_DLQ[ocr-ingestion-dlq.fifo]
        Q2[push-dispatch-queue]
        Q2_DLQ[push-dispatch-dlq]
    end

    subgraph Consumers [Worker Consumers]
        L1[OCR Lambda Worker]
        L2[Push Notification Worker]
    end

    Producers --> Bus
    Bus -->|Rule: source == ocr.upload| Q1
    Bus -->|Rule: source == notif.alert| Q2
    Q1 -->|MaxReceiveCount: 3| Q1_DLQ
    Q2 -->|MaxReceiveCount: 5| Q2_DLQ
    Q1 --> L1
    Q2 --> L2
```

---

## 6. Security, Encryption & Key Management

- **Encryption at Rest**:
  - Database, cache, queues, and S3 buckets are encrypted using AWS KMS Customer Managed Keys (CMK) with automated annual rotation.
- **Encryption in Transit**:
  - TLS 1.3 enforced across CloudFront, ALB, API Gateway, and internal service communication.
- **Secrets Management**:
  - Database passwords, third-party AI keys (Vertex AI / Bedrock), and JWT private signing keys are managed in **AWS Secrets Manager** with automated 90-day rotation Lambdas.
- **IAM Policies**:
  - Strict Principle of Least Privilege: ECS tasks and Lambda execution roles have granular resource-level IAM permissions with zero `*` wildcards on stateful resources.

---

## 7. Observability, Monitoring & Alarms

```mermaid
flowchart TD
    ECS_App[ECS Container Apps] --> CW_Logs[CloudWatch Logs Insights]
    Lambda_App[Lambda Workers] --> CW_Logs
    CW_Logs --> Alarms[CloudWatch Metric Alarms]
    Alarms -->|Trigger: P99 Latency > 500ms or 5XX > 1%| PagerDuty[DevOps On-Call / PagerDuty]
    
    ECS_App --> XRay[AWS X-Ray Distributed Tracing]
    Lambda_App --> XRay
    
    Kinesis[Audit Data Stream] --> OpenSearch[(Amazon OpenSearch Cluster)]
    OpenSearch --> Auditor[Auditor Dashboard]
```

### Critical CloudWatch Alarms:
1. `StockPulse-Aurora-ACU-High`: Triggers if Aurora ACUs remain $> 24$ for $> 10$ minutes.
2. `StockPulse-API-5xx-ErrorRate`: Triggers if 5XX response rate exceeds $1\%$ in a 5-minute evaluation period.
3. `StockPulse-OCR-DLQ-Messages`: Triggers immediately if any message lands in `ocr-ingestion-dlq.fifo`.
4. `StockPulse-Redis-Memory-High`: Triggers if ElastiCache Redis memory usage exceeds $80\%$.

---

## 8. Estimated Monthly Cloud Cost Breakdown (Production Baseline)

| AWS Component | Configuration Baseline | Estimated Monthly Cost (USD) |
|---|---|:---:|
| **Amazon Aurora Serverless v2** | Baseline 1–4 ACUs average + 100 GB storage | $180.00 |
| **AWS ECS Fargate** | 6 continuous tasks (0.5 vCPU, 1 GB) | $110.00 |
| **Amazon ElastiCache Redis** | 3-node `cache.t4g.medium` Multi-AZ cluster | $145.00 |
| **Amazon S3 & Glacier** | 500 GB S3 Standard + 2 TB Glacier Archive | $25.00 |
| **AWS Lambda & SQS** | 2,000,000 requests/month + 50,000 OCR extractions | $35.00 |
| **Amazon Bedrock / AI OCR** | ~15,000 receipt multi-modal extractions | $90.00 |
| **CloudFront, WAF & Route 53** | 500 GB data transfer + WAF rule inspection | $45.00 |
| **Secrets Manager & KMS** | 10 active secrets + CMK key requests | $15.00 |
| **CloudWatch & OpenSearch** | Log ingestion + 2-node `t3.medium.search` cluster | $85.00 |
| **Total Estimated Monthly Baseline** | **High-Availability Multi-AZ Architecture** | **~$730.00 / month** |
