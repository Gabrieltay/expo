import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { mockLinking, mockProperty, unmockAllProperties } from 'jest-expo';

import * as AuthSession from '../AuthSession';
import { getSessionUrlProvider } from '../SessionUrlProvider';

function applyMocks() {
  mockProperty(Constants.manifest, 'id', '@example/abc');
}

function mockOpenAuthSessionAsync(openBrowserFn) {
  mockProperty(WebBrowser, 'openAuthSessionAsync', jest.fn(openBrowserFn));
}

beforeEach(() => {
  applyMocks();
});

afterEach(() => {
  unmockAllProperties();
});

it(`returns correct redirect URL from getRedirectUrl`, () => {
  expect(AuthSession.getRedirectUrl()).toEqual('https://auth.expo.io/@example/abc');
});

it(`returns the correct return URL from getDefaultReturnUrl`, () => {
  expect(AuthSession.getDefaultReturnUrl()).toEqual(
    'exp://exp.host/@test/test/--/expo-auth-session'
  );
});

it(`opens WebBrowser startAsync to the start URL`, async () => {
  const authUrl = 'abcd.com';
  const returnUrl = 'efgh.com';

  mockOpenAuthSessionAsync(async () => ({ type: 'cancel' }));
  await AuthSession.startAsync({ authUrl, returnUrl });

  expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
    getSessionUrlProvider().getStartUrl(authUrl, returnUrl),
    returnUrl,
    { showInRecents: false }
  );
});

it(`only lets you call startAsync once at a time`, async () => {
  const authUrl = 'abcd.com';
  const returnUrl = 'efgh.com';
  const normalResponse = { type: 'cancel' };
  const lockedResponse = { type: 'locked' };

  mockProperty(console, 'warn', jest.fn());

  jest.useFakeTimers();

  mockOpenAuthSessionAsync(() => {
    return new Promise(resolve => {
      setTimeout(() => resolve(normalResponse), 0);
    });
  });

  const parallelStartAsyncCalls = Promise.all([
    AuthSession.startAsync({ authUrl, returnUrl }),
    AuthSession.startAsync({ authUrl, returnUrl }),
  ]);

  jest.runAllTimers();

  const [first, second] = await parallelStartAsyncCalls;
  expect(first).toEqual(normalResponse);
  expect(second).toEqual(lockedResponse);
  expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/Only one AuthSession/));
});

it(`returns success with params on redirect`, async () => {
  const emitLinkingEvent = mockLinking();
  const authUrl = 'http://example.io';
  const returnUrl = 'https://example-return.io/+';
  const returnUrlWithParams = `${returnUrl}?id=42#token=abc123`;

  const authSessionPromise = AuthSession.startAsync({
    authUrl,
    returnUrl,
  });
  emitLinkingEvent('url', { url: returnUrlWithParams });
  const result = await authSessionPromise;

  expect(result.type).toEqual('success');
  expect((result as any).params).toEqual({ token: 'abc123', id: '42' });
});

it(`returns error when errorCode is present`, async () => {
  const emitLinkingEvent = mockLinking();

  const authUrl = 'http://example.io';
  const returnUrl = 'https://example-return.io/+';
  const authSessionPromise = AuthSession.startAsync({
    authUrl,
    returnUrl,
  });

  const returnUrlWithParams = `${returnUrl}?errorCode=nope&id=42`;
  emitLinkingEvent('url', { url: returnUrlWithParams });

  const result = await authSessionPromise;
  expect(result.type).toEqual('error');
  expect((result as any).errorCode).toEqual('nope');
  expect((result as any).params).toEqual({ id: '42' });
});

it(`throws from AuthSession.startAsync if authUrl is falsy`, async () => {
  expect.assertions(1);
  try {
    await AuthSession.startAsync({
      authUrl: null as any,
    });
  } catch (e) {
    expect(e).toMatchSnapshot();
  }
});

it(`lets us call AuthSession.startAsync after param validation throws`, async () => {
  AuthSession.startAsync({ authUrl: null as any });

  const emitLinkingEvent = mockLinking();
  const authUrl = 'http://example.io';
  const returnUrl = 'https://example-return.io/+';
  const returnUrlWithParams = `${returnUrl}?id=42#token=abc123`;

  const authSessionPromise = AuthSession.startAsync({
    authUrl,
    returnUrl,
  });
  emitLinkingEvent('url', { url: returnUrlWithParams });

  const result = await authSessionPromise;

  expect(result.type).not.toEqual('locked');
});

it(`warns if user is @anonymous in getRedirectUrl`, () => {
  mockProperty(Constants.manifest, 'id', '@anonymous/abc');
  mockProperty(console, 'warn', jest.fn());
  AuthSession.getRedirectUrl();
  expect((console.warn as jest.Mock).mock.calls).toMatchSnapshot();
});
