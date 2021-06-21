source ./script/workspace.sh
for PACKAGE in $PACKAGE_LIST; do
  echo packages/$PACKAGE - clean
  (cd packages/$PACKAGE && rm -rf node_modules)
done

git clean -f -d -X