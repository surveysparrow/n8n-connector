import type {
	IDataObject,
	IHookFunctions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
} from 'n8n-workflow';
import { surveySparrowApiRequest, surveySparrowApiRequestAllItems } from './shared/transport';

export class SurveySparrowTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'SurveySparrow Trigger',
		name: 'surveySparrowTrigger',
		icon: { light: 'file:surveysparrow.svg', dark: 'file:surveysparrow.dark.svg' },
		group: ['trigger'],
		version: 1,
		description: 'Starts the workflow when a survey receives a new response',
		defaults: {
			name: 'SurveySparrow Trigger',
		},
		usableAsTool: true,
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'surveySparrowOAuth2Api',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'New Response',
						value: 'submission_completed',
						description: 'Triggers when a survey receives a new submission',
					},
				],
				default: 'submission_completed',
				required: true,
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
				description:
					'The survey to watch for new responses. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
		},
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const storedId = webhookData.webhookId as number | undefined;
				if (!storedId) return false;

				try {
					await surveySparrowApiRequest.call(
						this,
						'GET',
						`/v3/webhooks/${storedId}`,
					);
					return true;
				} catch {
					delete webhookData.webhookId;
					return false;
				}
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;
				const surveyId = this.getNodeParameter('surveyId') as number;

				const body: IDataObject = {
					name: 'n8n webhook',
					url: webhookUrl,
					survey_id: surveyId,
					http_method: 'POST',
					type: 'zapier',
				};

				const response = await surveySparrowApiRequest.call(
					this,
					'POST',
					'/v3/webhooks',
					body,
				);

				const data = (response.data ?? response) as IDataObject;

				if (!data.id) {
					return false;
				}

				const webhookData = this.getWorkflowStaticData('node');
				webhookData.webhookId = data.id;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				const storedId = webhookData.webhookId as number | undefined;

				delete webhookData.webhookId;

				if (storedId) {
					try {
						await surveySparrowApiRequest.call(
							this,
							'DELETE',
							`/v3/webhooks/${storedId}`,
						);
					} catch {
						// Webhook may already be gone — safe to ignore
					}
				}

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const body = this.getBodyData();

		const submission = body.submission as IDataObject | undefined;
		const questions = body.questions as IDataObject[] | undefined;
		const surveyName = body.surveyName as string | undefined;
		const resultLink = body.resultLink as string | undefined;

		if (submission && questions) {
			const answers = (submission.answers ?? []) as IDataObject[];
			const result: IDataObject = {};

			for (const question of questions) {
				const answer = answers.find((a) => a.question_id === question.id);
				const key = `${question.question} ID:${question.id}`;
				if (answer) {
					result[key] = answer.other ? answer.otherTxt : answer.answer;
				} else {
					result[key] = null;
				}
			}

			result.submissionId = submission.id;
			if (surveyName) result.surveyName = surveyName;
			if (resultLink) result.resultLink = resultLink;

			return {
				workflowData: [this.helpers.returnJsonArray(result)],
			};
		}

		return {
			workflowData: [this.helpers.returnJsonArray(body)],
		};
	}
}
