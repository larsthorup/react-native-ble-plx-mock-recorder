export DEPENDENCY_LIST="react-native-ble-plx-mock-recorder react-native-ble-plx-mock-recorder-mocha-core"

INSTALL_CMD="npm install --no-save"
for DEPENDENCY in $DEPENDENCY_LIST; do
  rm -rf node_modules/$DEPENDENCY
  INSTALL_CMD="${INSTALL_CMD} ../$DEPENDENCY/$DEPENDENCY-local.tgz"
done
echo $INSTALL_CMD
bash -c "$INSTALL_CMD"
