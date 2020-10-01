export default class Utils {
  static checkIfStateInTexas(address) {
    const splitArrays = address.split(",");
    if (splitArrays.length < 2) {
      return false;
    }
    return splitArrays[splitArrays.length - 2].toLowerCase().includes("tx");
  }
}
