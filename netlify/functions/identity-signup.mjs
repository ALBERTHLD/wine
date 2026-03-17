const handler = async (event) => {
  const { user } = JSON.parse(event.body || '{}');
  return {
    statusCode: 200,
    body: JSON.stringify({
      app_metadata: {
        ...user.app_metadata,
        roles: user.app_metadata?.roles || ['user'],
      },
    }),
  };
};

export { handler };
