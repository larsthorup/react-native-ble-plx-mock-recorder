source ./script/config.sh
for PACKAGE in $PACKAGE_LIST; do
  if [ "$PACKAGE" != "react-native-ble-plx-mock-recorder-mocha-template" ]; then
    echo packages/$PACKAGE - pack
    (cd packages/$PACKAGE && bash -c ./script/pack.sh)
  fi
done