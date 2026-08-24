# Corrected validation raising TokenExpiredError
if 'exp' in payload and time.time() > payload['exp']:
    raise TokenExpiredError('Token has expired')