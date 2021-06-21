source ./script/workspace.sh
for PACKAGE in $PACKAGE_LIST; do
  if [ "$PACKAGE" != "react-native-ble-plx-mock-recorder-mocha-template" ]; then
    echo packages/$PACKAGE - publish
    (cd packages/$PACKAGE && npm publish)
  fi
done
