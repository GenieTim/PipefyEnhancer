export default function deepEqual(x, y, exclusionList = []) {
  const objectKeys = Object.keys;
  const tx = typeof x;
  const ty = typeof y;
  return x && y && tx === "object" && tx === ty
    ? objectKeys(x).length === objectKeys(y).length &&
        objectKeys(x).every((key) => {
          return (
            exclusionList.includes(key) ||
            deepEqual(x[key], y[key], exclusionList)
          );
        })
    : x === y;
}
// module.exports = deepEqual
