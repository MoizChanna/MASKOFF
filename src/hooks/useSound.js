export function useSound() {
  const playSound = (name) => {
    console.log(`[MASKOFF SOUND] playSound('${name}')`)
  }

  return { playSound }
}
