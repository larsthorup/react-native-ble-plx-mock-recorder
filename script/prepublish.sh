source ./script/config.sh
for PACKAGE in $PACKAGE_LIST; do
  echo packages/$PACKAGE - prepublish
  (cd packages/$PACKAGE && bash -c ./script/prepublish.sh)
done