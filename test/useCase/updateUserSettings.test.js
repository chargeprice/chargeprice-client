import 'regenerator-runtime/runtime'
import Subject from '../../src/useCase/updateUserSettings'
import { VersionConflict } from '../../src/errors'

function buildDepsMocks(show, upsert) {
  return {
    userSettings: ()=> { return { 
      show: show,
      upsert: upsert,
      clearCache: ()=>{}
    } },
    settingsPrimitive: ()=>{}
  }
}

const oldVehicle = { id: "123", type: "car" }
const newVehicle = { id: "321", type: "car" }
const tariffs = { id: "456", type: "tariff" }
const changedTariffs = { id: "987", type: "tariff" }


test('no conflict',async () => {
  const oldSettings = {
    data: {
      vehicle: oldVehicle,
      tariffs: tariffs,
      version: 1,
    },
    meta: { products: [] }
  }
  
  const newSettings = {
    data: {
      vehicle: newVehicle,
      tariffs: tariffs,
      version: 2
    },
    meta: { products: [] }
  }

  const deptsMocks = buildDepsMocks(
    ()=>oldSettings,
    (s)=>s
  );

  const subject = await new Subject(deptsMocks).run({ vehicle: newVehicle}); 
  expect(subject).toEqual(newSettings.data);
});

function buildSettings(vehicle, tariffs, version){
  return {
    data: {
      vehicle: vehicle,
      tariffs: tariffs,
      version: version,
    },
    meta: { products: [] }
  }
}

test('with conflict',async () => {
  const outdatedOldSettings = buildSettings(oldVehicle, tariffs, 1)
  const actualOldSettings = buildSettings(oldVehicle, changedTariffs,  2)
  const expectedSettings = buildSettings(newVehicle, changedTariffs, 3)

  const showCalls = [()=>outdatedOldSettings, ()=> actualOldSettings ]
  const upsertCalls = [(s)=>{ throw new VersionConflict() }, (s)=>s]

  const deptsMocks = buildDepsMocks(
    ()=>showCalls.shift()(),
    (s)=>upsertCalls.shift()(s)
  );

  const subject = await new Subject(deptsMocks).run({ vehicle: newVehicle}); 
  expect(subject).toEqual(expectedSettings.data);
});

test('no change',async () => {
  const oldSettings = {
    data: {
      vehicle: oldVehicle,
      tariffs: tariffs,
      version: 1
    },
    meta: { products: [] }
  }

  const deptsMocks = buildDepsMocks(
    ()=>oldSettings,
    (s)=> { throw "error" }
  );

  const subject = await new Subject(deptsMocks).run({ vehicle: oldVehicle}); 
  expect(subject).toEqual(oldSettings.data);
});