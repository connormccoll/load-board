# Deployment

The app is a static Angular SPA hosted on **S3 + CloudFront** (private bucket, HTTPS, CDN,
SPA routing fallback). **GitHub Actions does everything** on every push to `main`: it
provisions the infrastructure with Terraform, then builds and publishes the app. Auth is
**OIDC** (assume-role), matching the inbox-aggregator project — no static AWS keys.

```
push to main ─▶ GitHub Actions
                 ├─ assume IAM role (OIDC)
                 ├─ bootstrap S3 state bucket (idempotent)
                 ├─ terraform init + apply   ─▶ S3 (private) + CloudFront + OAC
                 ├─ npm ci + npm run build
                 ├─ aws s3 sync              ─▶ S3
                 └─ CloudFront invalidation  ─▶ users (HTTPS)
```

## GitHub configuration

Settings ▸ Secrets and variables ▸ Actions.

Secrets:

| Secret | Value |
| --- | --- |
| `AWS_ROLE_ARN` | ARN of the IAM role GitHub assumes via OIDC |

Variables:

| Variable | Example |
| --- | --- |
| `AWS_REGION` | `us-east-1` |
| `TF_STATE_BUCKET` | `load-board-tf-state` (globally-unique; workflow creates it if missing) |

That's the entire setup. Push to `main` (or run the **Deploy** workflow manually) and the
app goes live at the URL printed in the run summary.

## One thing to verify: the IAM role trust policy

You already have a GitHub OIDC provider and role in this AWS account (from
inbox-aggregator). The role behind `AWS_ROLE_ARN` must **trust this repo** too — its trust
policy condition needs to allow `repo:connormccoll/load-board:*` (or `*` across your repos).
If the existing role is scoped only to the inbox-aggregator repo, either widen its
`token.actions.githubusercontent.com:sub` condition or create a separate role for this repo.

The role also needs permission to manage these resources: S3 (create/configure the site and
state buckets, put/delete objects), CloudFront (create distribution + OAC, create
invalidations), and `sts:GetCallerIdentity`.

## Tearing down

From `terraform/` with credentials configured: `terraform destroy`. (The state and the
state bucket persist; delete the state bucket manually if you want a full cleanup.)

## Notes / tradeoffs

- **Why S3 + CloudFront:** simplest durable host for a static SPA — free HTTPS, global CDN,
  bucket stays private (CloudFront reads it via Origin Access Control).
- **SPA routing:** CloudFront maps S3 403/404 to `/index.html` (200) so Angular's router
  handles deep links.
- **Caching:** hashed assets cached a year (`immutable`); `index.html` is `no-cache` and the
  CDN is invalidated each deploy, so releases are instant and safe.
- **State:** remote in S3 with native lockfile, so CI runs are incremental and safe to
  re-run. The state bucket is bootstrapped by the workflow.
