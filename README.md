# n8n-nodes-surveysparrow

[n8n](https://n8n.io) community nodes for [SurveySparrow](https://surveysparrow.com): share surveys through Email, SMS, and WhatsApp channels, create contacts, and trigger workflows on new survey submissions.

## Install (community nodes)

In n8n: **Settings → Community nodes → Install** and enter:

`n8n-nodes-surveysparrow`

Or install manually in your n8n environment:

```bash
npm install n8n-nodes-surveysparrow
```

Restart n8n, then enable the package under Community nodes if your instance requires it.

## Credentials

1. In SurveySparrow, create an **OAuth** application and note the **Client ID** and **Client Secret**.
2. Set the OAuth **redirect / callback URL** to your n8n OAuth callback (shown when you create credentials in n8n).
3. In n8n, create **SurveySparrow OAuth2 API** credentials and complete the sign-in flow.

OAuth and scopes are described in the [SurveySparrow OAuth documentation](https://developers.surveysparrow.com/rest-apis/OAuth/).

## Nodes

| Node | Purpose |
|------|---------|
| **SurveySparrow** | Share surveys via Email / SMS / WhatsApp; create contacts |
| **SurveySparrow Trigger** | Start a workflow when a new survey submission is received |

## Development (this monorepo)

```bash
cd n8n
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run lint
```

### Automated checks (Creator Portal / CI)

Run the same checks n8n recommends before publishing or submitting for review ([Test a node](https://docs.n8n.io/integrations/creating-nodes/test/), [Node linter](https://docs.n8n.io/integrations/creating-nodes/test/node-linter/)):

```bash
npm test
```

This runs `build` then `lint` (eslint-plugin-n8n-nodes-base via `n8n-node lint`). To **disable a rule for one line** when you have a good reason, use an ESLint disable comment as described under [Exceptions](https://docs.n8n.io/integrations/creating-nodes/test/node-linter/#exceptions).

Optional: after the package is on npm, run n8n’s security scanner (also referenced in [verification guidelines](https://docs.n8n.io/integrations/creating-nodes/build/reference/verification-guidelines/)):

```bash
npm run test:security
```

Or `npm run test:all` for both.

## Publish to npm

1. Log in: `npm login` (use an account allowed to publish this package name).
2. From `n8n/`: `npm run build && npm run lint`
3. `npm publish --access public` (use `--access public` if the package name is new to your npm user/org)

For automated releases and provenance, add a trusted publisher or `NPM_TOKEN` workflow as described in the [n8n deploy docs](https://docs.n8n.io/integrations/creating-nodes/deploy/submit-community-nodes/).

## License

MIT — see [LICENSE.md](LICENSE.md).
