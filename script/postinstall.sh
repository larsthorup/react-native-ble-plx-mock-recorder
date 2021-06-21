source ./script/config.sh
for PACKAGE in $PACKAGE_LIST; do
  echo packages/$PACKAGE - install
  (cd packages/$PACKAGE && npm install)
done

# TODO: demo
