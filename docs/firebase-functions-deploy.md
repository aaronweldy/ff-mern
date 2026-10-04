# Firebase Functions deployment

Production Functions deploy from `.github/workflows/firebase-hosting-merge.yml`
using the service account JSON in `FIREBASE_SERVICE_ACCOUNT_FF_MERN`. Hosting
uses the same account, but successful Hosting deployment does not prove that
Functions deployment permissions are complete.

Builds and Functions use Node.js 22. Both `functions/package.json` and the
`functions.runtime` override in `firebase.json` must agree. GitHub Actions
use Node.js 24 internally (`actions/checkout@v6`, `actions/setup-node@v6`,
`pnpm/action-setup@v6`); changing only `node-version` does not remove warnings
about an action's internal Node.js runtime.

## Deployment permissions

The deployment account is
`github-action-321760236@ff-mern.iam.gserviceaccount.com`. It needs its existing
Hosting Admin and Cloud Functions Developer roles, plus access to the Firebase
CLI's Extensions inspection, secret metadata, the runtime service account, and
Cloud Scheduler job provisioning for `onSchedule` functions.

Apply these commands as a project administrator when provisioning CI:

```sh
gcloud projects add-iam-policy-binding ff-mern \
  --member=serviceAccount:github-action-321760236@ff-mern.iam.gserviceaccount.com \
  --role=roles/firebaseextensions.editor --condition=None

gcloud projects add-iam-policy-binding ff-mern \
  --member=serviceAccount:github-action-321760236@ff-mern.iam.gserviceaccount.com \
  --role=roles/cloudscheduler.admin --condition=None

gcloud secrets add-iam-policy-binding SCORING_SERVICE_TOKEN --project=ff-mern \
  --member=serviceAccount:github-action-321760236@ff-mern.iam.gserviceaccount.com \
  --role=roles/secretmanager.viewer

gcloud iam service-accounts add-iam-policy-binding \
  54859804653-compute@developer.gserviceaccount.com --project=ff-mern \
  --member=serviceAccount:github-action-321760236@ff-mern.iam.gserviceaccount.com \
  --role=roles/iam.serviceAccountUser
```

Despite its name, the Extensions Editor role currently provides the
`firebaseextensions.configs.list` permission and project/client read permissions.
The Extensions Viewer role does not provide `firebaseextensions.configs.list`.
The Firebase CLI checks Extensions even for `--only functions`. Without this
permission, deployment stops with HTTP 403 at
`firebaseextensions.googleapis.com/.../instances`, after a successful build.

Secret Manager Viewer is scoped to `SCORING_SERVICE_TOKEN` and permits metadata
inspection, not reading its value. The runtime account separately needs its
existing Secret Accessor binding on that secret to run scheduled scoring.
Cloud Scheduler Admin permits the CLI to create/update/delete scheduled jobs.
Without it, function builds and updates can succeed but deployment still fails
with `cloudscheduler.jobs.update` denied when upserting the three schedules.

Do not commit service account keys or secret values to the repository.

These bindings live in Google Cloud IAM. Merging the Node upgrade does not
apply IAM changes; a deployment administrator must apply them separately.

References: [Extensions roles](https://cloud.google.com/iam/docs/roles-permissions/firebaseextensions),
[Functions runtime configuration](https://firebase.google.com/docs/functions/manage-functions).
