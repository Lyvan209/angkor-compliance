/**
 * Debug function for troubleshooting Netlify deployment issues
 */

export const handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const debugInfo = {
            timestamp: new Date().toISOString(),
            event: {
                httpMethod: event.httpMethod,
                path: event.path,
                queryStringParameters: event.queryStringParameters,
                headers: {
                    authorization: event.headers.authorization ? 'present' : 'missing',
                    'content-type': event.headers['content-type'],
                    origin: event.headers.origin,
                    referer: event.headers.referer
                },
                body: event.body ? 'present' : 'empty'
            },
            context: {
                functionName: context.functionName,
                functionVersion: context.functionVersion,
                awsRequestId: context.awsRequestId
            },
            environment: {
                NODE_ENV: process.env.NODE_ENV || 'not set',
                SUPABASE_URL: process.env.SUPABASE_URL ? 'configured' : 'missing',
                SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing',
                JWT_SECRET: process.env.JWT_SECRET ? 'configured' : 'missing'
            },
            netlify: {
                deployId: process.env.DEPLOY_ID || 'not available',
                context: process.env.CONTEXT || 'not available',
                branch: process.env.BRANCH || 'not available'
            }
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(debugInfo, null, 2)
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Debug function error',
                message: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
}; 