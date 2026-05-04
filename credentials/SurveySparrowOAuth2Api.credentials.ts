import type { Icon, ICredentialType, INodeProperties } from 'n8n-workflow';

export class SurveySparrowOAuth2Api implements ICredentialType {
	name = 'surveySparrowOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'SurveySparrow OAuth2 API';

	icon: Icon = {
		light: 'file:../icons/surveysparrow.svg',
		dark: 'file:../icons/surveysparrow.dark.svg',
	};

	// For community package: full URL. For nodes-base: camelCase slug like 'surveySparrow'.
	documentationUrl = 'https://developers.surveysparrow.com/rest-apis/OAuth/';

	properties: INodeProperties[] = [
		{
			displayName:
				'Create an OAuth application in SurveySparrow and paste the Client ID and Client Secret below. Use your n8n OAuth callback URL as the app redirect URI.',
			name: 'noticeOAuthApp',
			type: 'notice',
			default: '',
		},
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://app.surveysparrow.com/signup',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://integration.surveysparrow.com/o/oauth/token',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'view_survey manage_survey view_contacts manage_contacts view_webhooks manage_webhooks manage_share manage_survey_share',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
