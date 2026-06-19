# Freight Load Board — Deployment

Freight Load Board is a static Angular SPA deployed to **AWS S3 + CloudFront**, provisioned with **Terraform**, and continuously deployed via a **GitHub Actions** pipeline on every push to `main`.

## Live URL
https://d32qwrujunmx1g.cloudfront.net/

## Repository
https://github.com/connormccoll/load-board

## Infrastructure (Terraform)

All AWS resources are managed under `/terraform`:

| Resource | Purpose |
|---|---|
| **S3 bucket** | Stores the compiled Angular assets (`dist/freight-load-board/browser`) |
| **CloudFront distribution** | HTTPS, global edge delivery (`PriceClass_100` — NA + EU), and SPA routing fallback |
| **Origin Access Control (OAC)** | Restricts S3 access to CloudFront only — bucket is never public |
| **S3 state bucket** | Holds Terraform remote state; bootstrapped idempotently in CI |

CloudFront serves `index.html` for both 403 and 404 responses from S3, so Angular's client-side router handles all deep links correctly.

To provision or update infrastructure locally:

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # fill in required values
terraform init \
  -backend-config="bucket=<your-state-bucket>" \
  -backend-config="region=us-east-1"
terraform plan
terraform apply
```

## CI/CD (GitHub Actions — `.github/workflows/deploy.yml`)

Triggered on push to `main` (or manually via `workflow_dispatch`). Authentication uses **OIDC** — no static AWS keys are stored.

Pipeline steps in order:

1. **Configure AWS credentials** via OIDC (`AWS_ROLE_ARN` secret)
2. **Bootstrap Terraform state bucket** — creates the S3 state bucket if it doesn't already exist (idempotent)
3. **Terraform init + apply** — provisions or updates all infrastructure
4. **Install dependencies** — `npm ci` with Node 22
5. **Build** — `npm run build` → `dist/freight-load-board/browser/`
6. **Sync to S3** — hashed assets uploaded with `max-age=31536000,immutable`; `index.html` uploaded separately with `no-cache`
7. **Invalidate CloudFront cache** — `/*` invalidation ensures the new `index.html` is served immediately

## Required GitHub secrets / variables

| Name | Type | Description |
|---|---|---|
| `AWS_ROLE_ARN` | Secret | IAM role ARN for OIDC authentication |
| `AWS_REGION` | Variable | AWS region (e.g. `us-east-1`) |
| `TF_STATE_BUCKET` | Variable | S3 bucket name for Terraform state |

## Local development

```bash
npm ci
npm start          # dev server at http://localhost:4200
npm run build      # production build → dist/freight-load-board/browser/
```
