/**
 * Speech-bubble lines, by personality and event. Purely local, predefined.
 * Events: greet, poke, tickle, jump, spin, dance, drag, sleep, wake, idle
 */
export const REACTIONS = {
  happy: {
    greet: ['Hiii! 👋', 'Yay, you’re here!', 'Best day ever!'],
    poke: ['Hehe, boop!', 'That tickles!', 'Again, again!'],
    tickle: ['Hahaha! Stop! 😆', 'Hee hee hee!', 'Not the sides!'],
    jump: ['Wheee!', 'Up we go!', 'Boing!'],
    spin: ['Round and round!', 'Wheeee! 🌀', 'So fun!'],
    dance: ['Dance party! 🎶', 'Look at me go!', 'Shake it!'],
    drag: ['Woohoo, flying!', 'Weee!'],
    sleep: ['Nighty night…', 'Sweet dreams!'],
    wake: ['Good morning! ☀️', 'I’m up, I’m up!'],
    idle: ['Life is sweet!', 'Wanna play?', '♪ la la la ♪'],
  },
  shy: {
    greet: ['Oh… hi.', 'H-hello…'],
    poke: ['Eep!', 'Oh! …hi.', '…'],
    tickle: ['P-please… hehe', 'Eek! …hehe'],
    jump: ['Was that okay?', 'Hop…'],
    spin: ['I’m a bit dizzy…', 'Whoa…'],
    dance: ['Don’t look… 🙈', 'Am I doing it right?'],
    drag: ['W-where are we going?', 'Eek!'],
    sleep: ['Goodnight…', 'Shh…'],
    wake: ['Oh! You’re here…', 'Morning…'],
    idle: ['…', 'Um…', '*peeks*'],
  },
  sleepy: {
    greet: ['*yawn* …hey', 'Five more minutes…'],
    poke: ['Mmh?', 'Zzz… huh?', 'I’m awake…'],
    tickle: ['Hehe… sleepy…', 'Mmm… stop…'],
    jump: ['That was… a lot.', '*yawn*'],
    spin: ['Everything’s spinning… zzz', 'Whoa… nap time?'],
    dance: ['Slow dance…', 'Dancing… sleepily…'],
    drag: ['Carry me to bed…', 'Mmh, comfy…'],
    sleep: ['Finally… zzz', 'Zzz…'],
    wake: ['Already?', '*big yawn*'],
    idle: ['*yawn*', 'So cozy…', 'Is it nap time?'],
  },
  energetic: {
    greet: ['LET’S GO!', 'Hey hey hey!'],
    poke: ['HA! Again!', 'Boop boop!', 'Faster!'],
    tickle: ['HAHAHA!', 'Can’t stop laughing!'],
    jump: ['HIGHER!', 'To the moon! 🚀', 'Boing boing!'],
    spin: ['TURBO SPIN!', 'Zoom zoom!'],
    dance: ['Turn it up! 🔊', 'Non-stop party!'],
    drag: ['Faster! Faster!', 'Vroom!'],
    sleep: ['…okay, quick nap', 'Recharging! 🔋'],
    wake: ['FULLY CHARGED!', 'Let’s goooo!'],
    idle: ['Let’s do something!', 'I’m bored!', 'Race you!'],
  },
  curious: {
    greet: ['Ooh, who are you?', 'Hello! What’s that?'],
    poke: ['Ooh! What was that?', 'Interesting…', 'Do it again?'],
    tickle: ['Why does that tickle?', 'Hehe, fascinating!'],
    jump: ['How high was that?', 'Gravity is weird!'],
    spin: ['Is the room spinning?', 'Whoa, physics!'],
    dance: ['Is this how it goes?', 'New moves unlocked!'],
    drag: ['Where are we going?', 'New view!'],
    sleep: ['I wonder what I’ll dream…', 'Zzz… 🔭'],
    wake: ['What did I miss?', 'Ooh, morning!'],
    idle: ['What’s over there?', 'Hmm…', 'I have a question!'],
  },
};

/** Pick a line, avoiding an immediate repeat. */
export function pickLine(personality, event, last) {
  const pool = REACTIONS[personality]?.[event] ?? REACTIONS.happy[event] ?? [];
  if (!pool.length) return null;
  const options = pool.length > 1 ? pool.filter((l) => l !== last) : pool;
  return options[Math.floor(Math.random() * options.length)];
}
