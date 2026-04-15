export const isInputGoalOriented = (text: string): boolean => {
  const trimmedText = text.trim().toLowerCase();
  
  const goalKeywords = [
    'want to', 'wanna', 'like to', 'hope to', 'aim to', 'need to',
    'my goal is', 'i wish', 'i would like', 'i need', 'i want',
    'can i', 'how to', 'how do i', 'how can i', 'trying to',
    'would love to', 'looking to', 'seeking to', 'planning to'
  ];
  
  for (const keyword of goalKeywords) {
    if (trimmedText.includes(keyword)) {
      return true;
    }
  }
  
  return false;
};