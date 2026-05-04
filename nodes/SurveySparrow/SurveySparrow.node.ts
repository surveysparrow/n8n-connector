import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { surveySparrowApiRequest, surveySparrowApiRequestAllItems } from './shared/transport';

export class SurveySparrow implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SurveySparrow',
		name: 'surveySparrow',
		icon: { light: 'file:surveysparrow.svg', dark: 'file:surveysparrow.dark.svg' },
		group: ['output'],
		version: 1,
		subtitle: '={{$parameter["resource"] === "channel" ? ("Send Survey via " + $parameter["channelType"]) : ($parameter["operation"] + ": " + $parameter["resource"])}}',
		description: 'Interact with SurveySparrow — share surveys and manage contacts',
		defaults: {
			name: 'SurveySparrow',
		},
		usableAsTool: true,
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'surveySparrowOAuth2Api',
				required: true,
			},
		],
		properties: [

			// ==========================================
			//              Resource
			// ==========================================

			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Channel',
						value: 'channel',
					},
					{
						name: 'Contact',
						value: 'contact',
					},
				],
				default: 'channel',
			},

			// ==========================================
			//         Channel Operation
			// ==========================================

			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['channel'],
					},
				},
				options: [
					{
						name: 'Send Survey',
						value: 'sendSurvey',
						description: 'Send a survey to a contact via Email, SMS, or WhatsApp',
						action: 'Send a survey',
					},
				],
				default: 'sendSurvey',
			},

			// ==========================================
			//         Contact Operations
			// ==========================================

			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['contact'],
					},
				},
				options: [
					{
						name: 'Create',
						value: 'create',
						description: 'Create a new contact',
						action: 'Create a contact',
					},
				],
				default: 'create',
			},

			// ==========================================
			//        Channel fields
			// ==========================================

			{
				displayName: 'Channel Type',
				name: 'channelType',
				type: 'options',
				options: [
					{
						name: 'Email',
						value: 'email',
					},
					{
						name: 'SMS',
						value: 'sms',
					},
					{
						name: 'WhatsApp',
						value: 'whatsapp',
					},
				],
				default: 'email',
				required: true,
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: ['sendSurvey'],
					},
				},
				description: 'The channel to use for sending the survey',
			},

			{
				displayName: 'Survey Name or ID',
				name: 'surveyId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getSurveys',
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: ['sendSurvey'],
					},
				},
				description:
					'The survey to send. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},

			{
				displayName: 'Share Channel Name or ID',
				name: 'emailChannelId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getEmailChannels',
					loadOptionsDependsOn: ['surveyId'],
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: ['sendSurvey'],
						channelType: ['email'],
					},
				},
				description: 'Select the Email share to use from the list or enter an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},

			{
				displayName: 'Share Channel Name or ID',
				name: 'smsChannelId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getSmsChannels',
					loadOptionsDependsOn: ['surveyId'],
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: ['sendSurvey'],
						channelType: ['sms'],
					},
				},
				description: 'Select the SMS share to use from the list or enter an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},

			{
				displayName: 'Share Channel Name or ID',
				name: 'whatsAppChannelId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getWhatsAppChannels',
					loadOptionsDependsOn: ['surveyId'],
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: ['sendSurvey'],
						channelType: ['whatsapp'],
					},
				},
				description: 'Select the Whatsapp share to use from the list or enter an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},

			{
				displayName: 'Contact Email',
				name: 'contactEmail',
				type: 'string',
				placeholder: 'user@example.com',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: ['sendSurvey'],
						channelType: ['email'],
					},
				},
				description: 'Enter the Email address of the contact to send the survey to',
			},

			{
				displayName: 'Contact Mobile',
				name: 'contactMobile',
				type: 'string',
				placeholder: '+15551234567',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: ['sendSurvey'],
						channelType: ['sms', 'whatsapp'],
					},
				},
				description: 'Mobile number in E.164 format (e.g. +15551234567)',
			},

			{
				displayName: 'Variables',
				name: 'variables',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				default: {},
				displayOptions: {
					show: {
						resource: ['channel'],
						operation: ['sendSurvey'],
					},
				},
				description: 'Custom variables to pass with the share request',
				options: [
					{
						name: 'variable',
						displayName: 'Variable',
						values: [
							{
								displayName: 'Variable Name or ID',
								name: 'name',
								type: 'options',
								typeOptions: {
									loadOptionsMethod: 'getVariables',
									loadOptionsDependsOn: ['surveyId'],
								},
								default: '',
								description:
									'Variable name from the survey. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
							},
							{
								displayName: 'Value',
								name: 'value',
								type: 'string',
								default: '',
								description: 'Value to assign to the variable',
							},
						],
					},
				],
			},

		// ==========================================
		//        Contact: always-visible fields
		// ==========================================

		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			placeholder: 'user@example.com',
			default: '',
			displayOptions: {
				show: {
					resource: ['contact'],
				},
			},
			description: 'Email address of the contact. At least one of Email or Mobile is required.',
		},
		{
			displayName: 'Mobile',
			name: 'mobile',
			type: 'string',
			placeholder: '+15551234567',
			default: '',
			displayOptions: {
				show: {
					resource: ['contact'],
				},
			},
			description: 'Mobile number including country code (e.g. +15551234567). At least one of Email or Mobile is required.',
		},

		// ==========================================
		//        Contact: All additional fields under one "Add More"
		// ==========================================

		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'fixedCollection',
			typeOptions: {
				multipleValues: true,
			},
			placeholder: 'Add More',
			default: {},
			displayOptions: {
				show: {
					resource: ['contact'],
				},
			},
			description: 'Add optional contact fields and custom properties. For dropdown custom properties the allowed values are shown in the field description.',
			options: [
				{
					name: 'field',
					displayName: 'Field',
					values: [
						{
							displayName: 'Field Name or ID',
							name: 'name',
							type: 'options',
							typeOptions: {
								loadOptionsMethod: 'getContactAllFields',
							},
							default: '',
							description: 'Contact field or custom property to set. Choose from the list, or specify using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
						},
						{
							displayName: 'Value',
							name: 'value',
							type: 'string',
							default: '',
							description: 'Value to assign to the field',
						},
					],
				},
			],
		},
		],
	};

	methods = {
		loadOptions: {
			async getSurveys(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const data = await surveySparrowApiRequestAllItems.call(
					this,
					'GET',
					'/v3/surveys',
				);
				return data
					.filter((s) => s.id !== undefined)
					.map((s) => ({
						name: (s.name as string) || 'Untitled',
						value: s.id as number,
					}));
			},

			async getEmailChannels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const surveyId = this.getCurrentNodeParameter('surveyId') as number;
				if (!surveyId) return [];
				const data = await surveySparrowApiRequestAllItems.call(
					this, 'GET', '/v3/channels', {}, { survey_id: surveyId, type: 'EMAIL' },
				);
				return data
					.filter((c) => c.id !== undefined)
					.map((c) => ({ name: (c.name as string) || 'Email Share', value: c.id as number }));
			},

			async getSmsChannels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const surveyId = this.getCurrentNodeParameter('surveyId') as number;
				if (!surveyId) return [];
				const data = await surveySparrowApiRequestAllItems.call(
					this, 'GET', '/v3/channels', {}, { survey_id: surveyId, type: 'SMS' },
				);
				return data
					.filter((c) => c.id !== undefined)
					.map((c) => ({ name: (c.name as string) || 'SMS Share', value: c.id as number }));
			},

			async getWhatsAppChannels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const surveyId = this.getCurrentNodeParameter('surveyId') as number;
				if (!surveyId) return [];
				const data = await surveySparrowApiRequestAllItems.call(
					this, 'GET', '/v3/channels', {}, { survey_id: surveyId, type: 'WHATSAPP' },
				);
				return data
					.filter((c) => c.id !== undefined)
					.map((c) => ({ name: (c.name as string) || 'WhatsApp', value: c.id as number }));
			},

			async getVariables(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const surveyId = this.getCurrentNodeParameter('surveyId') as number;
				if (!surveyId) return [];
				const data = await surveySparrowApiRequestAllItems.call(
					this, 'GET', '/v3/variables', {}, { survey_id: surveyId },
				);
				return data
					.filter((v) => v.name !== undefined)
					.map((v) => ({
						name: v.name as string,
						value: v.name as string,
					}));
			},

		async getContactAllFields(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
			const staticFields: INodePropertyOptions[] = [
				{ name: 'First Name', value: 'firstName', description: 'First name of the contact' },
				{ name: 'Full Name', value: 'fullName', description: 'Full name of the contact' },
				{ name: 'Job Title', value: 'jobTitle', description: 'Job title / designation of the contact' },
				{ name: 'Language', value: 'language', description: 'Language code (e.g. en, fr, de)' },
				{ name: 'Last Name', value: 'lastName', description: 'Last name of the contact' },
				{ name: 'Phone', value: 'phone', description: 'Phone number of the contact' },
				{ name: 'Reference ID', value: 'referenceId', description: 'Reference ID for anonymous contacts' },
				{ name: 'Unique ID', value: 'uniqueId', description: 'Unique identifier to prevent duplicate contacts' },
			];

			const skipNames = new Set(['id', 'createddate', 'department_internal', 'team_internal']);
			const data = await surveySparrowApiRequestAllItems.call(
				this, 'GET', '/v3/contact_properties',
			);
			const customFields = data
				.filter((p) =>
					!p.is_default &&
					p.name !== undefined &&
					!skipNames.has(p.name as string) &&
					(p.contact_type_id === 1 || p.contact_type_id === 2),
				)
				.map((p) => {
					const allowedValues = [...new Set((p.allowed_values as string[] | undefined) ?? [])]
						.filter((v) => v !== undefined && v !== null && v !== '');
					const desc =
						p.type === 'DROPDOWN' && allowedValues.length > 0
							? `Allowed values: ${allowedValues.join(' | ')}`
							: (p.type as string) || '';
					return {
						name: (p.label as string) || (p.name as string),
						value: p.name as string,
						description: desc,
					};
				});

			return [...staticFields, ...customFields];
		},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
			const resource = this.getNodeParameter('resource', i) as string;

			let responseData: IDataObject;

			if (resource === 'channel') {
					const channelType = this.getNodeParameter('channelType', i) as string;
					const surveyId = this.getNodeParameter('surveyId', i) as number;

					let channelId: number;
					if (channelType === 'email') {
						channelId = this.getNodeParameter('emailChannelId', i) as number;
					} else if (channelType === 'sms') {
						channelId = this.getNodeParameter('smsChannelId', i) as number;
					} else if (channelType === 'whatsapp') {
						channelId = this.getNodeParameter('whatsAppChannelId', i) as number;
					} else {
						throw new NodeOperationError(
							this.getNode(),
							`Unsupported channel type: ${channelType}`,
							{ itemIndex: i },
						);
					}

					const variablesData = this.getNodeParameter('variables', i, {}) as IDataObject;
					const variables: IDataObject = {};
					const varItems = (variablesData.variable as IDataObject[] | undefined) ?? [];
					for (const v of varItems) {
						if (!v.name) continue;
						const val = v.value as string | undefined;
						if (val === undefined || val === null || val.toString().trim() === '') {
							throw new NodeOperationError(
								this.getNode(),
								`Variable "${v.name}" has an empty value. Please provide a value or remove the variable.`,
								{ itemIndex: i },
							);
						}
						variables[v.name as string] = val;
					}

					const body: IDataObject = { survey_id: surveyId };

					if (channelType === 'email') {
						const email = this.getNodeParameter('contactEmail', i) as string;
						body.contacts = [{ email }];
					} else {
						const mobile = this.getNodeParameter('contactMobile', i) as string;
						body.contacts = [{ mobile }];
					}

					if (Object.keys(variables).length) {
						body.variables = variables;
					}

					responseData = await surveySparrowApiRequest.call(
						this,
						'PUT',
						`/v3/channels/${channelId}`,
						body,
					);

			} else if (resource === 'contact') {
				const email = this.getNodeParameter('email', i, '') as string;
				const mobile = this.getNodeParameter('mobile', i, '') as string;

				if (!email && !mobile) {
					throw new NodeOperationError(
						this.getNode(),
						'At least one of Email or Mobile is required to create a contact',
						{ itemIndex: i },
					);
				}

				const body: IDataObject = {};
				if (email) body.email = email;
				if (mobile) body.mobile = mobile;

				const additionalFieldsData = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
				for (const f of (additionalFieldsData.field as IDataObject[] | undefined) ?? []) {
					if (f.name && f.value !== undefined && (f.value as string) !== '') {
						body[f.name as string] = f.value;
					}
				}

				responseData = await surveySparrowApiRequest.call(
					this,
					'POST',
					'/v3/contacts',
					body,
				);

			} else {
				throw new NodeOperationError(
					this.getNode(),
					`Unsupported resource: ${resource}`,
					{ itemIndex: i },
				);
			}

				returnData.push({ json: responseData, pairedItem: i });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: i,
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
