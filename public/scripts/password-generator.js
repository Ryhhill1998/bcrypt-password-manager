
const letters = "abcdefghijklmnopqrstuvwxyz";
const symbols = "!?><&%$^£*";
const numbers = "0123456789";


// Generate a random character from the required string
function generateRandomCharacters(characterString, numOfCharacters) {

  let randomString = "";

  for (var i = 0; i < numOfCharacters; i++) {
    let randomIndex = Math.floor((Math.random() * characterString.length)); // Generates random index between 0 and string length
    randomString += characterString[randomIndex];
  }

  return randomString;
};


// Shuffle characters in a String
function shuffleCharacters(characterString) {

  let shuffledCharacters = "";

  const lengthOfString = characterString.length;

  for (var i = 0; i < lengthOfString; i ++) {
    let randomIndex = Math.floor((Math.random() * characterString.length));
    let chosenCharacter = characterString[randomIndex];
    shuffledCharacters += chosenCharacter;
    let newStart = characterString.slice(0, randomIndex);
    let newEnd = characterString.slice(randomIndex + 1, characterString.length);
    characterString = newStart + newEnd;
  }

  return shuffledCharacters;

};


// Generate password
function generatePassword() {

  const shuffleNumber = 10;

  const numOfLetters = Math.floor((Math.random() * 5) + 8); // number between 8 and 12
  const numOfSymbols = Math.floor((Math.random() * 5) + 2); // number between 2 and 6
  const numOfNumbers = Math.floor((Math.random() * 3) + 2); // number between 2 and 4

  const randomLetters = generateRandomCharacters(letters, numOfLetters);
  const randomSymbols = generateRandomCharacters(symbols, numOfSymbols);
  const randomNumbers = generateRandomCharacters(numbers, numOfNumbers);

  let password = randomLetters + randomSymbols + randomNumbers;
  console.log(password);

  for (var i = 0; i < shuffleNumber; i++) {
    password = shuffleCharacters(password);
    console.log(password);
  }

  return password;

};


// Generate password if generate button is clicked
$(".generate").click(function() {
  let newPassword = generatePassword();
  $("#password").val(newPassword);
})
