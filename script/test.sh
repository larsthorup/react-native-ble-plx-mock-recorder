source ./script/workspace.sh
for PACKAGE in $PACKAGE_LIST; do
  if grep -q '"test":' "packages/$PACKAGE/package.json" ; then
    echo packages/$PACKAGE - test
    (cd packages/$PACKAGE && npm test)
  fi
done
