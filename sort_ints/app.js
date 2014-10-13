// The built-in array sort command uses alphabetical ordering even when used with integers.  The
// following example demonstrates that a custom sort algorithm is needed to sort numbers properly.

var arr = [11360, 9460];

arr.sort();

console.log(arr);

arr.sort(function(arg1, arg2) { return arg1 - arg2; });

console.log(arr);