import { expect } from 'chai';
import { PermissionsAndroid } from 'react-native';

before(async function () {
  this.timeout(20000); // Note: auto-allowing permissions might be slow
  console.log('On phone: please allow location permission');
  const permissionResult = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  expect(permissionResult).to.equal(PermissionsAndroid.RESULTS.GRANTED);
});
