import 'regenerator-runtime/runtime'
import Subject from '../../src/useCase/fetchValidAccessToken'

import jwtEncode from 'jwt-encode';
import { NotLoggedInError, RefreshTokenExpired } from '../../src/errors';

function buildToken(exp){
  return jwtEncode({exp: exp.getTime()/1000},"test");
}

function buildDepsMocks(storedTokens, refreshResponse= ()=>{ throw new Exception() }) {
  return {
    auth: () => { return { refreshAccessToken: refreshResponse } },
    settingsPrimitive: ()=> { return { authTokens: ()=>{ return { 
      set: ()=>{},
      clear: ()=>{},
      get: ()=> { return storedTokens }
    } } } }
  }
}

test('a non-expired access token',async () => {
  const futureDate = new Date(new Date().getTime()+1000);
  const expectedToken = buildToken(futureDate);

  const deptsMocks = buildDepsMocks({ accessToken: expectedToken, refreshToken: "" });
  const subject = await new Subject(deptsMocks).run(); 
  expect(subject).toBe(expectedToken);
});

test('expired access token with non-expired refresh token',async () => {
  const pastDate = new Date(new Date().getTime()-1);
  const expectedToken =  "abc123";
  const deptsMocks = buildDepsMocks(
    { accessToken: buildToken(pastDate), refreshToken: "abc" },
    ()=> { return { data: { attributes: { access_token: expectedToken, refresh_token: "123"  } } } }
  );

  const subject = await new Subject(deptsMocks).run(); 
  expect(subject).toBe(expectedToken);
});

test('no user logged in',async () => {
  const deptsMocks = buildDepsMocks();

  try {
    await new Subject(deptsMocks).run()
  }
  catch(ex){
    expect(ex instanceof NotLoggedInError).toBe(true);
  }
});

test('expired access token with expired refresh token',async () => {
  const pastDate = new Date(new Date().getTime()-1);
  const deptsMocks = buildDepsMocks(
    { accessToken: buildToken(pastDate), refreshToken: "abc" }
  );

  try {
    await new Subject(deptsMocks).run()
  }
  catch(ex){
    expect(ex instanceof RefreshTokenExpired).toBe(true);
  }
});