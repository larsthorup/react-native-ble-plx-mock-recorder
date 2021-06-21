source ./script/workspace.sh
for PACKAGE in $PACKAGE_LIST; do
  echo packages/$PACKAGE - install
  (cd packages/$PACKAGE && npm install)
done

for PROJECT in $DEMO_LIST; do
  echo demo/$PROJECT - install
  (cd demo/$PROJECT && npm install)
done
