
export function validatePassword(password, name){
    // check whether password doesn't contains at least 
    // 1 uppercase, 1 lowercase, 1 number, and 1 special character. 
    // If it doesn't contains everything mentioned, returns true
    const password_rgx = /^(.{0,7}|[^0-9]*|[^A-Z]*|[^a-z]*|[a-zA-Z0-9]*)$/

    function kmpSearch(pattern, text) {
      
        if (pattern.length == 0)
          return 0; // Immediate match
        // change inputs to lowercase so that comparing will be non-case-sensetive
       pattern = pattern.toLowerCase()
       text = text.toLowerCase()
        // Compute longest suffix-prefix table
        let lsp = [0]; // Base case
        for (let i = 1; i < pattern.length; i++) {
          let j = lsp[i - 1]; // Start by assuming we're extending the previous LSP
          while (j > 0 && pattern[i] !== pattern[j])
            j = lsp[j - 1];
          if (pattern[i] === pattern[j])
            j++;
          lsp.push(j);
        }
      
        // Walk through text string
        let j = 0; // Number of chars matched in pattern
        for (let i = 0; i < text.length; i++) {
          while (j > 0 && text[i] != pattern[j])
            j = lsp[j - 1]; // Fall back in the pattern
          if (text[i]  == pattern[j]) {
            j++; // Next char matched, increment position
            if (j == pattern.length)
              return i - (j - 1);
          }
        }
        return -1; // Not found
      }
    
      const hasNamePatternInPassword = kmpSearch(name, password)

      const isInValidPassword = password_rgx.test(password)
      console.log(password);
      console.log(isInValidPassword);
    
    if((hasNamePatternInPassword != -1) ){
        return Errors.PASSWORD_CONTAINS_NAME
    } else if(isInValidPassword == true) {
      console.log(`invalid in checker`);
        return Errors.INVALID_PASSWORD
    } else {
      console.log(`valid checker`);
      return `valid`
    }
}

export const Errors = {
  INVALID_PASSWORD: `Password must be in English and contains at least one uppercase and lowercase character, one number, and one special character`,
  PASSWORD_CONTAINS_NAME: `PASSWORD_MUST_NOT_CONTAIN_USER'S_INPUT`,
  USER_EXIST: 'USER_ALREADY_EXISTS',
  EMAIL_EXIST: 'EMAIL_ALREADY_EXISTS',
  NOT_FOUND: 'NOT_FOUND',
  WRONG_PASSWORD: `WRONG_PASSWORD`,
  INVALID_EMAIL: `INVALID_EMAIL`,
  WRONG_EMAIL: `WRONG_EMAIL`,
  CANNOT_CONTAIN_NUMBERS: `CANNOT_CONTAIN_NUMBERS`,
  LOGGED_THROUGH_SOCIAL: "LOGGED_THROUGH_SOCIAL",
  CANNOT_BE_EMPTY: `CANNOT_BE_EMPTY`,
  NOT_SIGNED_UP: `NOT_SIGNED_UP`,
  SIGNED_UP_DIFFERENTLY: `SIGNED_UP_DIFFERENTLY`,
  ALREADY_EXISTS: `ALREADY_EXISTS`
  
}
