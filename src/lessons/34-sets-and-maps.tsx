import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { OutputPredictor } from "@/components/lesson/output-predictor"
import { Quiz } from "@/components/lesson/quiz"

const setApi = `Set<String> tags = new HashSet<>();

tags.add("java");            // true  — it was added
tags.add("java");            // false — already present, set unchanged
tags.contains("java");       // O(1)  — this is the reason to use a Set
tags.remove("java");

// Set algebra, in place
a.retainAll(b);              // intersection
a.addAll(b);                 // union
a.removeAll(b);              // difference

// Deduplicating a list in one line, keeping insertion order
List<String> unique = new ArrayList<>(new LinkedHashSet<>(withDuplicates));`

const setKinds = `HashSet          O(1)      arbitrary order, may vary between runs
LinkedHashSet    O(1)      insertion order, slightly more memory
TreeSet          O(log n)  sorted; adds first/last/headSet/ceiling/floor

// TreeSet decides duplicates with compareTo, NOT equals:
TreeSet<String> ci = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
ci.add("Java");
ci.add("JAVA");     // false — compareTo says 0, so it is "already there"
ci.size();          // 1     — even though the strings are not equal`

const mapApi = `Map<String, Integer> stock = new HashMap<>();

stock.put("apples", 5);            // returns the previous value, or null
stock.get("apples");               // 5, or null if absent
stock.getOrDefault("pears", 0);    // 0 — avoids the null-unboxing NPE
stock.containsKey("apples");
stock.remove("apples");
stock.size();

// The methods that replace most get/put/null-check code:
stock.putIfAbsent("pears", 1);
stock.computeIfAbsent("pears", k -> loadFromDb(k));
stock.merge("apples", 1, Integer::sum);        // add 1, or start at 1
stock.compute("apples", (k, v) -> v == null ? 1 : v - 1);
stock.forEach((key, value) -> System.out.println(key + "=" + value));

// Iterating: entrySet is the one to use
for (Map.Entry<String, Integer> entry : stock.entrySet()) {
    System.out.println(entry.getKey() + " -> " + entry.getValue());
}`

const grouping = `// The pattern that appears in every codebase — counting
Map<String, Integer> counts = new HashMap<>();
for (String word : words) {
    counts.merge(word, 1, Integer::sum);
}

// ...and grouping
Map<String, List<Order>> byCustomer = new HashMap<>();
for (Order order : orders) {
    byCustomer.computeIfAbsent(order.customerId(), k -> new ArrayList<>())
              .add(order);
}

// Both have a stream equivalent, covered in the collectors lesson:
Map<String, Long> counts2 = words.stream()
        .collect(groupingBy(w -> w, counting()));`

const nullRules = `                    null key     null values
HashMap             one          any number
LinkedHashMap       one          any number
TreeMap             no  (NPE)    yes
Hashtable           no           no        (legacy — do not use)
ConcurrentHashMap   no           no        (so absence is unambiguous)
Map.of(...)         no           no

// This is why get() returning null is ambiguous in a HashMap:
// the key may be absent, or present with a null value.
// containsKey distinguishes them; getOrDefault does not.`

const lruCache = `// LinkedHashMap in access-order mode is an LRU cache in six lines
Map<String, User> cache = new LinkedHashMap<>(16, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry<String, User> eldest) {
        return size() > 1000;
    }
};`

const treeSetPredictor = `import java.util.*;

public class Sets {
    public static void main(String[] args) {
        Set<String> set = new TreeSet<>(Comparator.comparing(String::length));
        set.add("cat");
        set.add("dog");
        set.add("bird");
        System.out.println(set.size());
    }
}`

export default function SetsAndMapsLesson() {
  return (
    <>
      <p>
        A <code>Set</code> answers "is this in here?" and a <code>Map</code> answers "what's stored under this
        key?". Both are backed by the same hashing machinery — <code>HashSet</code> is literally a{" "}
        <code>HashMap</code> with the values ignored — so learning one teaches you the other.
      </p>

      <h2>Set</h2>
      <CodeBlock language="java" filename="Set operations" code={setApi} />
      <CodeBlock language="text" filename="three implementations" code={setKinds} />

      <OutputPredictor
        question="How many elements end up in the set?"
        code={treeSetPredictor}
        options={[
          { id: "a", text: "3" },
          { id: "b", text: "2" },
          { id: "c", text: "1" },
          { id: "d", label: "It throws ClassCastException", text: "" },
        ]}
        correctId="b"
        explanation={
          <p>
            A <code>TreeSet</code> decides whether two elements are duplicates using its comparator, not{" "}
            <code>equals</code>. Comparing by length, "cat" and "dog" both give 3, so the second is rejected as
            already present. "bird" is 4 and gets in. This is a documented and deliberate deviation from the{" "}
            <code>Set</code> contract, and it catches almost everyone once.
          </p>
        }
      />

      <AnalogyCard title="A guest list and a cloakroom.">
        The guest list only answers one question — are you on it? Adding a name twice changes nothing. The cloakroom
        is a map: you hand over a coat, get a ticket, and later the ticket retrieves exactly that coat. Two people
        can leave identical coats, but each ticket points to one of them, and reusing a ticket number would
        overwrite the association.
      </AnalogyCard>

      <h2>Map</h2>
      <CodeBlock language="java" filename="Map operations" code={mapApi} />

      <Callout variant="tip" title="merge and computeIfAbsent are the ones to learn">
        Most map code written before Java 8 is a <code>get</code>, a null check, and a <code>put</code>. These two
        methods collapse that into a single atomic-looking line — and on a <code>ConcurrentHashMap</code> they are
        genuinely atomic, which the three-line version never was.
      </Callout>
      <CodeBlock language="java" filename="counting and grouping" code={grouping} />

      <h2>Nulls</h2>
      <CodeBlock language="text" filename="who accepts what" code={nullRules} />

      <h2>An LRU cache for free</h2>
      <CodeBlock language="java" filename="LinkedHashMap in access order" code={lruCache} />
      <p>
        The third constructor argument switches iteration from insertion order to access order, moving an entry to
        the end each time it's read. Override <code>removeEldestEntry</code> and the oldest entry is evicted
        automatically once the map exceeds your limit.
      </p>

      <CommonMistake
        title="a mutable object used as a map key"
        wrong={`Map<Point, String> labels = new HashMap<>();
Point p = new Point(1, 2);       // Point has mutable x and y in its hashCode
labels.put(p, "origin-ish");

p.setX(5);                       // the hash has now changed
labels.get(p);                   // null — it is filed under the old hash
labels.size();                   // 1  — still in there, just unreachable`}
        right={`// Use an immutable key
record Point(int x, int y) { }

Map<Point, String> labels = new HashMap<>();
labels.put(new Point(1, 2), "origin-ish");
// A "change" means a new key, which is exactly right.`}
        explanation={
          <p>
            A hash map files an entry by the key's hash at insertion time and never revisits that decision. Mutating
            a key afterwards leaves the entry in the wrong bucket — present in <code>size()</code>, visible when
            iterating, and unfindable by <code>get</code>. Immutable keys make this impossible, which is why{" "}
            <code>String</code>, boxed numbers, enums and records are the usual choices.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A set holds each item at most once and is very fast at answering "is this in here?". A map stores pairs
            — look up by the key, get the value. Both use the key's <code>hashCode</code> and <code>equals</code> to
            find things, so keys need those to be correct, and shouldn't change while they're in there.
          </p>
        }
        developer={
          <p>
            <code>HashSet</code> wraps a <code>HashMap</code> with a dummy value.{" "}
            <code>LinkedHashMap</code> threads a doubly-linked list through the entries for predictable iteration
            and can run in access order for LRU. <code>TreeMap</code>/<code>TreeSet</code> are red-black trees
            ordered by <code>Comparable</code> or a <code>Comparator</code>, and use comparison rather than{" "}
            <code>equals</code> to detect duplicates. Note <code>get</code> returning null is ambiguous in a{" "}
            <code>HashMap</code>, which is one reason <code>ConcurrentHashMap</code> bans nulls entirely.
          </p>
        }
        interview={
          <p>
            Expect: <code>HashMap</code> vs <code>TreeMap</code> vs <code>LinkedHashMap</code>; what makes a good
            key (immutable, correct <code>equals</code>/<code>hashCode</code>); and why a mutable key breaks
            lookups. Strong extras: <code>TreeSet</code> using <code>compareTo</code> for duplicate detection, the
            null-key rules per implementation, and building an LRU cache from{" "}
            <code>LinkedHashMap</code> in a few lines.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="map.get(key) returns null on a HashMap. What do you know?"
        options={[
          { id: "a", text: "The key is definitely absent" },
          { id: "b", text: "Either the key is absent, or it is present with a null value — containsKey distinguishes them" },
          { id: "c", text: "The map is empty" },
          { id: "d", text: "The key's hashCode is broken" },
        ]}
        correctId="b"
        explanation="HashMap permits null values, so a null result is genuinely ambiguous. Use containsKey when the difference matters, getOrDefault when it doesn't, and note that ConcurrentHashMap forbids nulls precisely to remove this ambiguity."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Count and group in three styles"
        hint={
          <p>
            The one-liners are <code>merge(word, 1, Integer::sum)</code> and{" "}
            <code>computeIfAbsent(key, k -&gt; new ArrayList&lt;&gt;()).add(value)</code>.
          </p>
        }
      >
        Given a list of words, build a frequency map three ways: with an explicit <code>get</code>/null-check/
        <code>put</code>, with <code>merge</code>, and with a stream <code>groupingBy</code>. Then group the words
        by their first letter. Compare the three for readability — and note which one you'd trust on a{" "}
        <code>ConcurrentHashMap</code>.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What makes a good HashMap key?"
        answer={
          <p>
            Three things. First, correct <code>equals</code> and <code>hashCode</code>, overridden together from the
            same fields — otherwise two logically identical keys land in different buckets and lookups fail.
            Second, <strong>immutability</strong>, or at least immutability of the fields the hash uses: the map
            files an entry by its hash at insertion time and never re-checks, so mutating a key afterwards leaves
            the entry unreachable by <code>get</code> while still counting towards <code>size()</code>. Third, a
            well-distributed hash, so entries spread across buckets instead of collapsing into one — though{" "}
            <code>HashMap</code> mitigates poor distribution by spreading the hash and converting long collision
            chains into balanced trees. In practice that means <code>String</code>, boxed primitives, enums, and
            records are the natural choices, and a mutable entity keyed on changeable fields is the thing to avoid.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "HashSet is a HashMap with the values ignored — both need correct equals and hashCode.",
          "Linked variants keep insertion order; Tree variants sort and add navigation methods.",
          "TreeSet and TreeMap decide duplicates by comparison, not equals — a real source of surprises.",
          "merge, computeIfAbsent and getOrDefault replace most get/null-check/put code.",
          "Keys must be immutable in the fields their hash uses, or entries become unreachable.",
        ]}
      />
    </>
  )
}
