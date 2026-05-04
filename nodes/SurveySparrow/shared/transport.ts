import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	IPollFunctions,
	IWebhookFunctions,
} from 'n8n-workflow';

const CREDENTIAL_NAME = 'surveySparrowOAuth2Api';
const BASE_URL = 'https://api.surveysparrow.com';

type RequestContext =
	| IExecuteFunctions
	| ILoadOptionsFunctions
	| IPollFunctions
	| IHookFunctions
	| IWebhookFunctions;

export async function surveySparrowApiRequest(
	this: RequestContext,
	method: IHttpRequestMethods,
	path: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<IDataObject> {
	const options: IHttpRequestOptions = {
		method,
		url: `${BASE_URL}${path}`,
		headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
		json: true,
	};

	if (Object.keys(qs).length) {
		options.qs = qs;
	}

	if (Object.keys(body).length) {
		options.body = body;
	}

	return (await this.helpers.httpRequestWithAuthentication.call(
		this,
		CREDENTIAL_NAME,
		options,
	)) as IDataObject;
}

export async function surveySparrowApiRequestAllItems(
	this: RequestContext,
	method: IHttpRequestMethods,
	path: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<IDataObject[]> {
	qs.page = 1;
	qs.limit = qs.limit ?? 100;

	const all: IDataObject[] = [];

	let response: IDataObject;
	do {
		response = await surveySparrowApiRequest.call(this, method, path, body, qs);
		const data = response.data;
		if (Array.isArray(data)) {
			all.push(...(data as IDataObject[]));
		}
		(qs.page as number)++;
	} while (response.has_next_page === true);

	return all;
}
