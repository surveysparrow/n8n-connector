# Changelog

All notable changes to `n8n-nodes-surveysparrow` are documented here.

## [1.3.1] - 2026-04-30
### Changed
- Fixed n8n lint rule violations (display name / description conventions for dynamic-options fields).
- Added GitHub Actions `publish.yml` workflow for provenance-signed npm publishing (required from May 1 2026).
- Populated `repository.url` and `homepage` fields in `package.json`.

## [1.3.0] - 2026-04-15
### Changed
- Replaced separate "Custom Properties" and "Dropdown Custom Properties" sections with a single unified **Additional Fields** `fixedCollection` that includes all optional default contact fields and all custom properties under one "Add More" button.
- Added `getContactAllFields` load-options method (combines static default fields with dynamic custom properties from `/v3/contact_properties`).
- Replaced `required: true` on Survey Name or ID with a friendly runtime error "Please select a survey to continue."

## [1.2.0] - 2026-04-09
### Changed
- Consolidated "Share via Email", "Share via SMS", and "Share via WhatsApp" into a single **Send Survey** action with a **Channel Type** selector.
- Moved all optional default contact fields and custom properties into a unified **Additional Fields** collection; only Email and Mobile are shown by default.
- Added empty-value validation for survey variables.
- Removed "Preferred Channels" from the Create Contact form.
- Hidden the Operation dropdown for single-action resources (Send Survey, Create Contact) while keeping both actions discoverable in the n8n action picker.

## [1.1.0] - 2026-03-20
### Added
- Dynamic loading of contact custom properties from `/v3/contact_properties`.
- Separate sections for text/non-dropdown and dropdown custom properties with allowed-value hints.
- Lazy loading and clearing of Survey and Channel dropdowns when switching channel type.

## [1.0.0] - 2026-02-01
### Added
- Initial release.
- **SurveySparrow Trigger** node: webhook-based trigger for new survey submissions.
- **SurveySparrow** action node: Share a survey via Email, SMS, or WhatsApp; Create a contact.
- OAuth2 credential type (`surveySparrowOAuth2Api`).
