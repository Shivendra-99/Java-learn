/**
 * Plain-English versions of every interview answer, keyed by question id.
 *
 * Kept separate from interview-questions.ts purely so the two kinds of writing
 * stay easy to review side by side — the formal answer is what you'd say in the
 * room, this is the version you'd give a friend. Every id in the question bank
 * should appear here; `missingSimpleAnswers` below is used to check that.
 *
 * Backticks render as inline code, same as in the main answers.
 */

export const SIMPLE_ANSWERS: Record<string, string> = {
  // ------------------------------------------------------------ fundamentals
  "jdk-jre-jvm":
    "Three things inside each other, like a factory containing a car containing an engine. The engine runs Java programs. The car is the engine plus all the ready-made parts programs expect. The factory is the car plus the machinery for building new ones. You install the factory; your users only need the car.",

  "compiled-or-interpreted":
    "Both, one after the other. Before you run it, your code is translated into instructions for a pretend computer. While it runs, the parts that get used a lot are translated again into instructions for your real processor. That's why Java starts a bit slowly and then speeds up.",

  "platform-independence":
    "The translated file is what travels, not the thing that runs it. Every kind of computer gets its own program that knows how to read that file — so the file itself works everywhere. Write the file once, and someone else's machine supplies the reader.",

  "main-signature":
    "Every word is doing a job. `public` so the launcher is allowed to call it. `static` because when the program starts there are no objects yet, so there's nothing to call it on. `void` because the exit code comes from elsewhere. And the array is where your command-line arguments arrive.",

  "jit-compiler":
    "A translator who starts interpreting live so you can begin immediately, then notices which sentences keep repeating and writes out a polished version of just those. You get an instant start and, shortly afterwards, real speed — which is why timing the first few runs of anything measures the wrong thing.",

  "primitives-and-wrappers":
    "Plain numbers are fast and small but can't be empty and can't go in a list. So each one has an object version that can. You pay a small cost for the object, and in exchange it fits everywhere objects fit — which includes every collection in the language.",

  "autoboxing-integer-cache":
    "Java quietly keeps one copy of each small number and hands the same one out repeatedly, so comparing two small numbers with `==` accidentally works. Above 127 it makes fresh copies, and the same comparison suddenly fails. Which is why you compare with `equals` — the version that works passes your tests and the failure waits for production.",

  "integer-overflow":
    "Like a five-digit odometer rolling from 99,999 to 00,000. Go one past the biggest number and it wraps round to the most negative one, silently. Use the bigger type before you need it, or the methods that throw instead of wrapping.",

  // --------------------------------------------------------------------- oop
  "four-pillars":
    "Keep data and the rules about it together. Let one thing build on another. Let one instruction mean different things depending on what you're holding. And show what something does without showing how. The third one is the useful one — it's what lets you add a new kind of thing without editing everything that uses it.",

  "overloading-vs-overriding":
    "Same name, different inputs: the compiler picks one while you're writing. Same name, same inputs, a more specific object: the object picks one while it's running. That's the whole difference — one is decided in advance, the other at the last moment.",

  "abstract-vs-interface":
    "If the family members share things they remember, you need an abstract class — only that can hold data. If you're describing an ability that unrelated things might have, use an interface, because something can have many abilities but only one parent.",

  "default-methods":
    "Adding a method to an interface used to break everyone who had implemented it. So Java allowed interfaces to ship a ready-made version that everyone inherits for free. It exists mainly so the language could grow without breaking every library in the world overnight.",

  "why-single-inheritance":
    "If you could inherit from two parents that both remember a name, nobody could say which name your object has. Java avoided the question entirely. Abilities are fine to collect in bulk, because they don't remember anything.",

  "composition-over-inheritance":
    "Inheriting means you're stuck with how the parent does things internally, and those internals can change under you. Holding one as a helper means you only rely on what it publicly promises, you can swap it, and you only expose the bits you want.",

  "static-override":
    "No. You can write one with the same name in the child, but which one runs is decided by the label on the variable, not by what's actually in it — the opposite of normal methods. Which is why calling one through an object is confusing enough that every tool warns about it.",

  "private-constructor":
    "It stops anyone using `new` from outside, which sounds useless and isn't. It's how a class hands out cached copies instead of fresh ones, how you guarantee only one exists, and how a class of pure helpers says 'never make one of me'.",

  "initialization-order":
    "Class-level setup runs once, the first time the class is used. Then for each new object: the parent is built, the field defaults are filled in, and only then does your constructor body run. So a constructor assignment overwrites whatever the field's own initialiser set.",

  "encapsulation-real":
    "Not really. A setter for every field is a public field with extra typing — anything can still put the object into a nonsensical state. The point is offering actions like 'mark this paid', which get to check the rules first, rather than 'set this field to whatever you like'.",

  "records-vs-class":
    "A record is for things that ARE their contents, like a receipt: two identical ones are interchangeable and nobody edits them. Use a normal class when the thing has an identity separate from its values — an order is the same order before and after it ships.",

  "enum-singleton":
    "You want exactly one of something, and Java's fixed-list type gives you that for free — created safely even with many threads, impossible to duplicate by saving and reloading, and impossible to sneak a second one past using reflection. All the loopholes are closed before you start.",

  "final-keyword":
    "Three different meanings by position. On a variable: you can't point it somewhere else — but whatever it points at can still change. On a method: children can't replace it. On a class: nobody can build on it at all.",

  "inner-vs-static-nested":
    "A class inside another can secretly hold on to the outer object. That's occasionally handy and often an accident — if one of those gets stored somewhere long-lived, it keeps the whole outer object in memory. Adding `static` removes the hidden link, and is what you almost always want.",

  // ------------------------------------------------------------------ memory
  "stack-vs-heap":
    "Every worker has their own small desk, cleared completely when they finish a task — that's the stack. There's one shared warehouse for anything big, and things stay there until nobody has the aisle number written down — that's the heap. Your variable holds the aisle number, not the crate.",

  "pass-by-value":
    "You hand over a photocopy of an address. The person can go to that house and paint the door, and you'll see it. They can also scribble a different address on their copy, and your piece of paper is unchanged. That's why you can't write a working swap.",

  "gc-eligibility":
    "Things disappear when nothing can find them any more, not when you finish with them. Two objects pointing only at each other are both unreachable, so both go. And you can't order a cleanup — you can only stop referring to things.",

  "memory-leak-java":
    "Yes, and it's always the same shape: something is still holding on. A list that only ever grows, a listener you registered and never unregistered, a value parked on a reused thread. The collector is doing its job correctly — the reference genuinely still exists.",

  "string-immutable":
    "Because a piece of text that can't change is safe to hand out. It can't be altered after someone has checked it, any number of threads can read it at once, its fingerprint can be worked out once and remembered, and identical ones can safely be shared.",

  "string-pool-intern":
    "Java keeps one copy of each piece of text written directly in your code and hands the same one out every time. That makes comparing two of them with `==` accidentally work, which is exactly why you shouldn't do it — the moment the text comes from a file or a user, it stops working.",

  "stringbuilder":
    "Text can't be edited, so joining in a loop retypes the whole thing each time round. Ten thousand words means retyping an ever-growing page ten thousand times. A builder is a scratch pad you add to cheaply, and you type it up once at the end.",

  // ------------------------------------------------------------- collections
  "arraylist-vs-linkedlist":
    "Almost never. One is a shelf where 'the fifth book' is one movement; the other is a treasure hunt where each clue points at the next. The hunt looks better on paper for inserting in the middle, and loses in practice because getting to the middle is the slow part.",

  "hashmap-internals":
    "A filing cabinet with numbered drawers. The key's fingerprint tells you which drawer, which is one movement however much is filed. Inside a drawer you flick through by hand — fine for two, slow for two hundred, so once a drawer gets crowded it alphabetises itself.",

  "equals-hashcode":
    "The fingerprint decides which drawer, and the comparison checks once you're there. Two things that count as equal must give the same fingerprint, or the second one gets filed in a different drawer and is never found — present in the cabinet, invisible to anyone looking properly.",

  "hashmap-vs-hashtable":
    "The old ones are a shop with a single till: correct, and everyone queues even to ask a question. The concurrent one lets people browse with no queue at all and only closes off the aisle being restocked. Same guarantees, far less waiting.",

  "good-hashmap-key":
    "Something that knows when it equals another one, gives a matching fingerprint when it does, and — crucially — never changes afterwards. Change a key after filing it and it's still in the cabinet, just in the wrong drawer, and nothing will ever find it again.",

  "comparable-vs-comparator":
    "Some things have one obvious order — dates, numbers — so the type carries it. A pile of CVs doesn't: by date, by surname, by experience are all valid, so the ordering is something you pick up when you need it and can have several of.",

  "fail-fast":
    "The loop hands out a bookmark and quietly counts changes. Remove something behind its back and the counts stop matching, so the next step refuses to continue rather than skipping items unpredictably. Ask the loop itself to remove things, and both counts stay in step.",

  "generics-why":
    "The angle brackets tell the compiler what's in the box. Before them, everything came out as 'some object' and you had to promise what it was — and if you were wrong, you found out much later, somewhere else entirely. Now the mistake is a red squiggle on the line that made it.",

  "type-erasure":
    "The compiler checks the angle brackets and then rubs them out, so at runtime a list of names and a list of numbers are the same kind of list. It was done so old code kept working. It's also why you can't create a new one of an unknown type, or ask an object what its brackets said.",

  "pecs":
    "A crate labelled 'some kind of fruit' is safe to take things out of, and unsafe to put things into — it might be oranges. A crate labelled 'accepts anything at least as general as an apple' is the opposite. Read from one, write to the other.",

  "array-covariance":
    "Old-style arrays let you treat a box of names as a box of anything, and then check at the last moment whether what you're putting in fits — throwing if it doesn't. The newer generic types refuse the swap up front instead, because they have no way to check later.",

  "treeset-duplicates":
    "A sorted set decides two things are the same by comparing them, not by asking whether they're equal. So a comparison that only looks at length will quietly keep just one of 'cat' and 'dog' — same length, so as far as it's concerned they're the same entry.",

  // -------------------------------------------------------------- exceptions
  "checked-vs-unchecked":
    "Some problems the compiler makes you acknowledge in writing — a file that might genuinely be missing. The rest are your mistakes, like using something that isn't there, and it stays out of your way because the fix is to correct the code, not to catch it.",

  "finally-always":
    "Yes, for anything you'd actually rely on: after success, after a failure, even after a return. The only escapes are the program being killed outright. But never return from inside one — it silently throws away whatever was happening.",

  "try-with-resources":
    "Declare what you opened in the brackets and it closes itself however you leave, including on the way out from a failure. And if closing also goes wrong, it keeps the original problem as the headline and files the closing failure underneath — the old way lost the headline entirely.",

  "suppressed-exceptions":
    "When both the work and the cleanup fail, you want to hear about the work — the cleanup failure is a footnote. Java keeps the first as the real error and attaches the second underneath it, so nothing is lost and nothing is buried.",

  "custom-exception-design":
    "Name it after what went wrong, not after which class noticed. Always pass along the original problem, or the trace stops at your line and the real cause vanishes. And carry the useful numbers as fields, so a handler doesn't have to read them out of a sentence.",

  // ------------------------------------------------------------------ modern
  "functional-interface":
    "For a small piece of behaviour to be passed around, it needs a slot to fit into — an interface with exactly one job. That's all a functional interface is. Java ships a handful: turn A into B, answer yes or no, take something, produce something.",

  "lambda-vs-anonymous":
    "The old way created a whole little class with its own identity, which could shadow names from around it and confuse everyone. A lambda is just an expression living in the same scope as the code around it, and it usually doesn't even allocate anything.",

  "effectively-final":
    "The value gets copied into the lambda when it's made, because the method it came from may be long gone by the time the lambda runs. If you could then change the original, there'd be two copies disagreeing and no way to say which is 'the' variable.",

  "intermediate-vs-terminal":
    "Everything before the last step is just describing the work — nothing happens. The last step is what runs it. That's why a pipeline without one silently does nothing, and why searching a million items can stop after two.",

  "map-vs-flatmap":
    "One turns each thing into one other thing. The other turns each thing into several and then tips them all into one pile. Use the second whenever you'd otherwise end up with a list of lists.",

  "optional-purpose":
    "A labelled envelope that might be empty, so you can see the possibility before opening it. Its value is in the label being part of the method's description. Use it for what a method hands back — not for fields, not for parameters, and don't just rip it open without looking.",

  "orelse-vs-orelseget":
    "The first one prepares the fallback whether or not it's needed. The second only prepares it if it is. With a plain value that's invisible; with a database lookup you've just run a pointless query on every single call.",

  "groupingby":
    "Choosing which pigeonhole each letter goes in. The second argument is what happens once it's there — pile them up, count them, or add up the postage. Two arguments, two independent decisions, and they nest as deep as you like.",

  "sealed-classes":
    "A list of exactly who's allowed to be one of these. That sounds restrictive and it buys you something: the compiler now knows every possibility, so it can tell you when you've forgotten to handle one — at build time, rather than at 3am.",

  "localdatetime-vs-instant":
    "'Nine o'clock' isn't a moment until you say where. Store the actual moment, which is the same everywhere, and turn it into someone's local time only when you show it to them. Keep the zone separately if you need the original wall clock back.",

  // -------------------------------------------------------------- concurrency
  "start-vs-run":
    "One of them actually creates a second worker. The other just runs the task yourself, right now, on the spot. The second is the classic beginner mistake because nothing complains — the code works, it's simply not concurrent.",

  "stop-a-thread":
    "You can ask, not order. Killing one outright could leave shared data half-updated behind a lock, so it isn't allowed. You raise a flag and the worker is expected to notice and stop tidily — and if it's asleep, waking it clears the flag, so you have to raise it again.",

  "synchronized-vs-volatile":
    "One means 'one person in this room at a time'. The other means 'when I change this, everyone else sees it'. You often need both, and a counter needs the first — because adding one is really three steps, and marking it visible doesn't stop someone stepping in halfway.",

  "count-not-atomic":
    "Adding one is three things: read it, add, write it back. Two workers can both read five, both work out six, and both write six — two increments and only one of them counted. Either let one in at a time, or use the counter that does all three as one step.",

  "deadlock":
    "Two people each holding the thing the other needs, both waiting politely, forever. Nothing times out. The fix is boring and reliable: everyone picks things up in the same agreed order, so the circle can never form.",

  "executor-benefits":
    "Don't hire a chef per order. Put orders on a rail and let a fixed number of chefs take the next one — that caps how many exist, reuses them, and the rail getting long tells you exactly what's wrong. Just make sure the rail has a length limit.",

  "future-vs-completablefuture":
    "The first is a ticket you stand at the counter waiting for. The second lets you say what should happen when it's ready and walk away — and lets you combine two orders that are cooking at the same time.",

  "virtual-threads":
    "Workers so cheap you can have a million of them. The old ones each cost a megabyte and a slot in the operating system, so waiting on the network was expensive and everyone moved to awkward callback code. Now waiting is nearly free, and simple straight-line code scales again.",

  "concurrent-compound":
    "Each individual step is safe; the sequence isn't. Two workers both check, both find nothing there, both make one, and one overwrites the other. That's why there are single methods that do check-and-add as one indivisible step.",

  // --------------------------------------------------------------- practical
  "debug-memory":
    "First find out whether it's a leak or just a busy day: does the memory drop after a cleanup, or keep climbing? If it climbs, take a snapshot of the heap and ask which single thing is holding the most — then follow the trail to whoever is still pointing at it. It's usually a list nobody empties.",

  "debug-deadlock":
    "Nothing happening and no CPU being used means everyone is waiting for something. Take a snapshot of what every worker is doing, twice, a few seconds apart. Whoever is on the same line both times is genuinely stuck, and the snapshot names what they're waiting for.",

  "dependency-conflict":
    "Two of your libraries each wanted a different version of a third one, only one could win, and you compiled against the loser. Print the tree of what actually got pulled in, find the two versions, and state explicitly which one you want.",

  "good-unit-test":
    "It checks one thing, its name says which, and it doesn't care what ran before it. No real clocks, no network, nothing random. And it must actually check something — a test that only proves nothing exploded is a smoke alarm nobody has ever tested.",

  "slow-code":
    "Look at the shape of the work before the details. Searching a list inside a loop is the usual culprit, and turning it into a lookup beats every clever micro-optimisation combined. Then check whether the work is needed at all. Then measure. Only then start tuning.",

  "immutability-benefits":
    "Writing in pen instead of pencil. Nobody can change it behind your back, any number of readers can look at once with no coordination, and if it was valid when created it's valid forever. You write a new line instead of editing one, which is a small cost for never having to ask who changed this.",
  // ------------------------------------------------------------- extra concepts
  "method-reference-vs-lambda":
    "When a lambda does nothing but pass its input to one method, you can name the method directly instead. `String::length` is just a shorter way of writing `s -> s.length()`. The moment the lambda does anything more — a check, reordering — write it out in full; don't bend the code to fit the shorthand.",

  "lambda-checked-exception":
    "Only if the slot it's filling allows it. Most of the built-in slots say 'no exceptions', which is why calling something that reads a file inside a `map` won't compile. You either catch it and rethrow an unchecked one on the spot, or make your own slot that permits it. A lambda has to obey the rules of the interface it's plugging into.",

  "deep-vs-shallow-copy":
    "A shallow copy is a new outer box holding the same inner things — poke an inner thing through one copy and the other sees it. A deep copy duplicates everything, so the two are completely independent. It only matters when the inner things can change; for text or immutable values, both copies behave identically.",

  // -------------------------------------------------------- stream coding problems
  "second-largest":
    "Throw away duplicates first, sort biggest-to-smallest, skip one, take the next. The trap is the duplicates step: without it, a repeated top value means you just skip one copy of it and hand back the biggest again. And keep it as a 'maybe' — a list might not have a second value at all.",

  "sort-by-field":
    "Say `comparing(the getter)`, add `.reversed()` for descending, add `.thenComparing(...)` to break ties. Then decide: `list.sort(...)` rearranges the original, while the stream version leaves it alone and gives you a fresh list. And never compare by subtracting — it overflows and flips the order.",

  "elements-appearing-once":
    "Count how many times each value shows up, then keep the ones whose count is one. The catch: the plain grouping gives you an unordered result, so if you want the answers in the order they first appeared, ask for a `LinkedHashMap` specifically.",

  "frequency-map":
    "Group by the value and count — one line gives you a table of value-to-how-many. To keep only the repeats, walk that table and keep the entries whose count is more than one. It's the same shape as counting words.",

  "find-duplicates":
    "Use a set of things you've already seen: trying to add something that's already in it fails, and that failure marks a duplicate. Neat and fast, but it quietly changes a thing outside the stream, so don't make it run in parallel — the counting version is the safe one for that.",

  "sum-of-evens":
    "Keep the evens, then switch to a stream of plain numbers and add them up. The switch is the whole point of the question: a stream of number-objects doesn't even have an 'add them all' method — that only exists once you've turned them into raw numbers.",

  "filter-map-collect":
    "Three steps: keep what you want, change each survivor, then gather the results. Each item goes through all three before the next starts, and nothing happens at all until that final gather step — leave it off and the whole thing quietly does nothing.",

  "partition-even-odd":
    "Ask to split by a yes/no question and you get back both piles — the yeses and the noes — in one pass. Prefer this to grouping by a true/false value, because it always gives you both piles even when one is empty, so you never reach for a pile that isn't there.",

  // -------------------------------------------------------------- design patterns
  "what-is-a-pattern":
    "A named answer to a problem that keeps coming up. Someone worked out a good solution, gave it a name, and now saying the name conveys the whole idea. You're already using them without knowing — a `Comparator` is one, a `StringBuilder` is one. The only real danger is sprinkling them where there's no problem to solve.",

  "best-singleton":
    "An enum with one value. Java builds it safely even with lots of threads, and — unlike a hand-rolled one — nobody can sneak a second copy in by saving-and-reloading or by reflection. All the traps are already closed. Just don't fill it with data that changes per user; that's a global variable in disguise.",

  "factory-method-vs-abstract-factory":
    "One makes a single thing and lets a subclass decide exactly which; the other makes a whole matching set — a button, a checkbox, a menu that all go together — and you pick the set once. One product via inheritance versus a family via a chosen factory. And the everyday `List.of` / `valueOf` kind is just a nicely-named creator that a plain constructor can't be.",

  "builder-when":
    "When a thing has lots of settings, especially optional ones. A giant constructor full of arguments is unreadable and you can't skip the middle ones. A builder lets you set them by name, skip what you don't need, and check everything's valid at the end. Below about four settings it's just extra ceremony — a plain constructor is clearer.",

  "strategy-vs-state":
    "They look the same in code. Strategy is 'here's how to do it' — you hand in the method, like a sort's comparison rule, and it doesn't change itself. State is 'how I behave depends on what I currently am', and the states move you along to the next state — draft becomes submitted becomes shipped. One is a choice you make; the other is a lifecycle the object runs itself through.",

  "observer-leak":
    "Things that care sign up with the thing that changes, and it tells all of them when it changes — without knowing who they are. The classic trap is forgetting to sign OFF: the source keeps a hold of every listener, so a listener that never leaves lives as long as the source does, dragging everything it touches along. It's worst when the listener is a little lambda that quietly grabbed `this`.",

  "decorator-vs-inheritance":
    "Add features by wrapping, not by making a subclass for every combination. Each wrapper looks like the thing it wraps, so you can keep stacking — encrypt, then compress, then write. It's why reading a file in Java looks like Russian dolls. Two features would be four subclasses the old way; here it's two small wrappers you combine however you like.",

  "adapter-vs-decorator-vs-proxy":
    "All three are wrappers; the difference is what they show on the outside. An adapter is a travel plug — it changes the shape so two things that couldn't connect, connect. A decorator keeps the same shape and adds a feature. A proxy keeps the same shape but acts as a gatekeeper, deciding what actually reaches the real thing.",

  "template-vs-strategy":
    "Template Method is a recipe with the steps and their order fixed, and one or two blanks for the subclass to fill — and the recipe is locked so nobody reorders it. Strategy hands in a whole step as an object from outside. One fixes the shape and lets you fill gaps by inheriting; the other lets you swap a whole piece by passing it in.",

  "proxy-spring":
    "A proxy is a stand-in that looks exactly like the real object but decides what gets through — check permission, load lazily, cache. Spring's `@Transactional` works by quietly wrapping your object in one of these. The famous catch: if one method of your object calls another method of the same object directly, that call skips the stand-in entirely, so the annotation silently does nothing. Move the annotated method to a separate object to fix it.",

}

/** Ids in the question bank with no plain-English version yet. */
export function missingSimpleAnswers(ids: string[]): string[] {
  return ids.filter((id) => !(id in SIMPLE_ANSWERS))
}
