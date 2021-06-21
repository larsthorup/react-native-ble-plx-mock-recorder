source ./script/workspace.sh
for PACKAGE in $PACKAGE_LIST; do
  if [ "$PACKAGE" != "react-native-ble-plx-mock-recorder-mocha-template" ]; then
    echo packages/$PACKAGE - bump
    (cd packages/$PACKAGE && npm --no-git-tag-version version patch)
  fi
done
