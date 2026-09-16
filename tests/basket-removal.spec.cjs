const {test,expect}=require('@playwright/test');
const PT=require('../personal-engine.js');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const baseline={module:{exports:{}},require};
vm.runInNewContext(execFileSync('git',['show','4258f38:personal-engine.js'],{encoding:'utf8'}),baseline);
const previous=baseline.module.exports;
require('../program-data.js');

test('catalogue sans basket et ancien focus compatible',()=>{
  expect(PT.catalog).toHaveLength(200);
  expect(PT.catalog.some(e=>e.kind==='basket')).toBe(false);
  const state=PT.initialState();state.checkIn.focus='basket';
  expect(PT.validateState(state).checkIn.focus).toBe('mixed');
  const result=PT.generate(state);
  expect(result.exercises.some(e=>e.kind==='basket')).toBe(false);
});

test('programme original identique sur 144 configurations',()=>{
  const clean=result=>{const {id,createdAt,...rest}=result;return rest;};
  for(let week=1;week<=12;week++){
    for(const letter of Object.keys(global.RehaabProgram.blocks[Math.floor((week-1)/4)])){
      for(const owned of [['bodyweight'],PT.equipment.map(e=>e.id),['bodyweight','court']]){
        const state=PT.initialState();
        state.profile.experience='regular';state.profile.impactReady=true;state.profile.safeties=true;
        state.owned=owned;state.checkIn.equipment=owned;
        expect(clean(PT.fromProgram(global.RehaabProgram,week,letter,state))).toEqual(clean(previous.fromProgram(global.RehaabProgram,week,letter,state)));
      }
    }
  }
});
