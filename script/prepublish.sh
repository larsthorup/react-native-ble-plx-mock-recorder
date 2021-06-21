. ./script/config.sh
for PACKAGE in $PACKAGE_LIST; do
  (cd packages/$PACKAGE && bash -c ./script/prepublish.sh)
done