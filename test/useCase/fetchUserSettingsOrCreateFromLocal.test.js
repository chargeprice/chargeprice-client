import 'regenerator-runtime/runtime'
import Subject from '../../src/useCase/fetchUserSettingsOrCreateFromLocal'
import { NotFound, NotLoggedInError } from '../../src/errors'

function buildDepsMocks(show, upsert, store={}) {
  return {
    userSettings: ()=> { return { 
      show: show,
      upsert: upsert
    } },
    settingsPrimitive: ()=> { return {
      getObject: (key)=>store[key]
    }}
  }
}

const vehicle = { id: "123", type: "car" }
const tariffs = [{ id: "456", type: "tariff" }]

const settings = {
  vehicle: vehicle,
  tariffs: tariffs
}

const store = { myTariffIds: ["456"], myVehicle: vehicle }

test('logged in & existing',async () => {
  const deptsMocks = buildDepsMocks(()=> settings);

  const subject = await new Subject(deptsMocks).run(); 
  expect(subject.vehicle).toEqual(vehicle);
  expect(subject.tariffs).toEqual(tariffs);
});

test('logged in & not existing',async () => {
  const deptsMocks = buildDepsMocks(
    ()=> { throw new NotFound }, 
    ()=>settings,
    store
  );

  const subject = await new Subject(deptsMocks).run(); 
  expect(subject.vehicle).toEqual(vehicle);
  expect(subject.tariffs).toEqual(tariffs);
});

test('not logged in',async () => {
  const deptsMocks = buildDepsMocks(
    ()=> { throw new NotLoggedInError() },
    null,
    store
  );

  const subject = await new Subject(deptsMocks).run(); 
  expect(subject.vehicle).toEqual(vehicle);
  expect(subject.tariffs).toEqual(tariffs);
}); 