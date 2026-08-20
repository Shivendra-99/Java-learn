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
import { StepFlowDiagram } from "@/components/diagram/step-flow-diagram"
import { Hash, Boxes, ListChecks, Shuffle, TreePine, Expand } from "lucide-react"

const structure = `HashMap holds an array of buckets — Node<K,V>[] table.

  index   bucket contents
  -----   ------------------------------------------
    0     null
    1     Node("ana", 30) -> Node("bob", 25)      <- a collision chain
    2     null
    3     Node("cara", 41)
   ...
   15     null

Each Node stores: hash, key, value, next.
Capacity is always a power of two (default 16), so the modulo
reduction is a bitmask: index = (capacity - 1) & hash.`

const spread = `// HashMap does not use your hashCode directly. It spreads it:
static int hash(Object key) {
    int h = key.hashCode();
    return h ^ (h >>> 16);        // mix the high bits into the low ones
}

// Why: the index only uses the LOW bits (capacity - 1) & hash.
// A hashCode whose variation lives in the high bits — common for
// composed hashes — would otherwise collide constantly.

// Example with capacity 16 (mask 0b1111):
//   hashCode 0x0000_1000 -> index 0
//   hashCode 0x0001_1000 -> index 0    same bucket, different keys
//   after spreading, those high bits reach the low ones and separate.`

const loadFactor = `capacity      16     the number of buckets (always a power of two)
load factor  0.75    resize when size exceeds capacity * loadFactor
threshold     12     16 * 0.75

put #13 triggers a resize:
  - allocate a new table of 32 buckets
  - rehash every existing entry into it
  - threshold becomes 24

// Resizing is O(n). Pre-size when you know roughly how many entries
// you will have — and account for the load factor:
Map<String, User> users = new HashMap<>(1000 / 0.75f + 1);`

const treeify = `// Since Java 8: a bucket with too many entries becomes a red-black tree
TREEIFY_THRESHOLD   = 8    // chain length at which a bucket treeifies
UNTREEIFY_THRESHOLD = 6    // and reverts on shrinking
MIN_TREEIFY_CAPACITY = 64  // below this, resize instead of treeifying

// Effect: worst-case lookup goes from O(n) to O(log n).
// This was a security fix as much as a performance one — deliberately
// colliding keys were a denial-of-service vector for web frameworks
// that put request parameters straight into a HashMap.`

const collisionPredictor = `import java.util.*;

public class Collide {
    static class Key {
        final String name;
        Key(String name) { this.name = name; }

        @Override public int hashCode() { return 1; }   // everything collides
        @Override public boolean equals(Object o) {
            return o instanceof Key k && k.name.equals(name);
        }
    }

    public static void main(String[] args) {
        Map<Key, Integer> map = new HashMap<>();
        map.put(new Key("a"), 1);
        map.put(new Key("b"), 2);
        map.put(new Key("a"), 3);
        System.out.println(map.size() + " " + map.get(new Key("a")));
    }
}`

const concurrency = `// HashMap is NOT thread-safe. Two threads resizing at once could,
// before Java 8, produce a circular chain and an infinite loop in get().
// Java 8 fixed the infinite loop but not the lost updates or the
// corrupted size — it is still unsafe.

Map<String, Integer> safe = new ConcurrentHashMap<>();     // use this
Map<String, Integer> slow = Collections.synchronizedMap(new HashMap<>());
// synchronizedMap locks the whole map per call, and compound
// operations (get-then-put) still are not atomic.`

export default function HashMapInternalsLesson() {
  return (
    <>
      <p>
        <code>HashMap</code> is the most-asked-about class in Java interviews, and knowing how it works pays off in
        real code too: it explains why keys need a good <code>hashCode</code>, why mutating a key loses it, and why
        pre-sizing a large map is worth doing.
      </p>

      <h2>The structure</h2>
      <CodeBlock language="text" filename="an array of buckets" code={structure} />

      <h2>What put() does</h2>
      <StepFlowDiagram
        title="map.put(key, value), step by step"
        steps={[
          {
            id: "hash",
            label: "Hash the key",
            detail: "Call key.hashCode(), then spread it: h ^ (h >>> 16). The spread mixes high bits down so they influence the bucket choice.",
            icon: Hash,
          },
          {
            id: "index",
            label: "Find the bucket",
            detail:
              "index = (capacity - 1) & hash. Because capacity is a power of two, this bitmask is equivalent to modulo but far cheaper — and it is why capacity is always a power of two.",
            icon: Boxes,
          },
          {
            id: "empty",
            label: "Empty bucket? Done",
            detail: "If nothing is there, a new Node is stored and the size incremented. This is the common case and it is O(1).",
            icon: ListChecks,
            tone: "success",
          },
          {
            id: "collision",
            label: "Occupied? Walk the chain",
            detail:
              "Compare hashes first (cheap), then keys with equals. A matching key means replace the value; reaching the end means append a new node.",
            icon: Shuffle,
            tone: "warning",
          },
          {
            id: "treeify",
            label: "Chain too long? Treeify",
            detail:
              "At 8 entries in one bucket — and a table of at least 64 — the chain converts to a red-black tree, bounding worst-case lookup at O(log n).",
            icon: TreePine,
          },
          {
            id: "resize",
            label: "Too full? Resize",
            detail:
              "Once size exceeds capacity x 0.75, the table doubles and every entry is rehashed. O(n), but rare, so the amortised cost of put stays O(1).",
            icon: Expand,
          },
        ]}
      />

      <AnalogyCard title="A filing cabinet with numbered drawers.">
        The hash tells you which drawer, and that's a single movement regardless of how much is filed. Inside a
        drawer you flick through the folders by hand, comparing names — fine when there are two, slow when there are
        two hundred. A bad <code>hashCode</code> is a cabinet where every document goes in drawer 3, which is a
        linear search with extra steps. Treeification is the cabinet noticing and alphabetising that drawer.
      </AnalogyCard>

      <h2>Why the hash gets spread</h2>
      <CodeBlock language="java" filename="h ^ (h >>> 16)" code={spread} />

      <h2>Capacity, load factor, resizing</h2>
      <CodeBlock language="text" filename="growth" code={loadFactor} />
      <Callout variant="tip" title="Pre-size large maps">
        Building a map of 10,000 entries from the default capacity of 16 means about ten resizes, each rehashing
        everything present so far. Passing an initial capacity removes them all. Remember to divide by the load
        factor — <code>new HashMap&lt;&gt;(1000)</code> still resizes at 750 entries.
      </Callout>

      <h2>Treeification</h2>
      <CodeBlock language="text" filename="Java 8's improvement" code={treeify} />

      <h2>All collisions, one bucket</h2>
      <OutputPredictor
        code={collisionPredictor}
        options={[
          { id: "a", text: "2 3" },
          { id: "b", text: "3 3" },
          { id: "c", text: "2 1" },
          { id: "d", text: "1 3" },
        ]}
        correctId="a"
        explanation={
          <p>
            Returning a constant from <code>hashCode</code> is <em>legal</em> — the contract only requires equal
            objects to agree — so the map still behaves correctly: two distinct keys, and putting "a" again replaces
            its value with 3. What it destroys is performance: every entry lands in one bucket, so lookups degrade
            to a scan (mitigated to O(log n) once the bucket treeifies). Correct but slow is the signature failure
            of a bad hash function.
          </p>
        }
      />

      <h2>Thread safety</h2>
      <CodeBlock language="java" filename="do not share a HashMap" code={concurrency} />

      <CommonMistake
        title="assuming iteration order is stable or meaningful"
        wrong={`Map<String, Integer> scores = new HashMap<>();
scores.put("ana", 90);
scores.put("bob", 85);

// Test asserts the printed order — passes locally, fails in CI
assertEquals("{ana=90, bob=85}", scores.toString());`}
        right={`// Order matters? Say so.
Map<String, Integer> scores = new LinkedHashMap<>();   // insertion order
Map<String, Integer> sorted = new TreeMap<>();         // key order

// Or compare in an order-independent way
assertEquals(Map.of("ana", 90, "bob", 85), scores);`}
        explanation={
          <p>
            <code>HashMap</code> iteration follows bucket order, which depends on hash values, capacity, and
            insertion history. It's deterministic for a given sequence on a given JVM, which is exactly what makes
            it dangerous: it looks stable until a resize, a different key, or a different Java version reorders it.
            Never assert on it.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A <code>HashMap</code> is an array of buckets. The key's hash code picks a bucket, so finding something
            is one jump rather than a search. If two keys pick the same bucket, the entries sit there together and
            are compared one by one. When the map gets too full it makes a bigger array and re-files everything.
          </p>
        }
        developer={
          <p>
            Table size is a power of two so indexing is <code>(n - 1) &amp; hash</code>; the hash is spread with{" "}
            <code>h ^ (h &gt;&gt;&gt; 16)</code> so high bits influence the index. Buckets are singly-linked node
            chains that treeify into red-black trees at 8 entries when the table is at least 64, giving O(log n)
            worst case. Resize happens above <code>capacity * 0.75</code> and rehashes everything — Java 8 splits
            each bucket into a "stay" and "move" list without recomputing hashes. It is not thread-safe; use{" "}
            <code>ConcurrentHashMap</code>.
          </p>
        }
        interview={
          <p>
            Be ready to narrate put and get end to end, and to explain the three constants: 16, 0.75, 8. Points that
            distinguish a strong answer: the power-of-two masking, why the hash is spread, that treeification was
            partly a denial-of-service mitigation, and that a constant <code>hashCode</code> is correct but
            catastrophic. Then the follow-up you can expect: what breaks if a key is mutated after insertion.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why is a HashMap's capacity always a power of two?"
        options={[
          { id: "a", text: "So that the load factor of 0.75 divides evenly" },
          { id: "b", text: "So the bucket index can be computed with a bitmask, (capacity - 1) & hash, instead of a modulo" },
          { id: "c", text: "Because Java arrays must have power-of-two lengths" },
          { id: "d", text: "To make treeification possible" },
        ]}
        correctId="b"
        explanation="A bitmask is far cheaper than integer division, and it works only when the capacity is a power of two. The cost is that the index then uses only the low bits of the hash, which is exactly why HashMap spreads the hash with h ^ (h >>> 16) first."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Make a HashMap behave like a list"
        hint={
          <p>
            Give the key class a <code>hashCode</code> that returns a constant, then time 50,000 insertions against
            the same class with a real hash.
          </p>
        }
      >
        Build two versions of a key class — one with a proper <code>hashCode</code>, one returning a constant — and
        time filling a map with 50,000 of each. Measure the difference, then work out how much of the constant-hash
        version's remaining speed comes from treeification by comparing against a run with fewer than 64 entries.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="How does HashMap work internally?"
        answer={
          <p>
            It's an array of buckets, default 16 and always a power of two. On <code>put</code>, the key's{" "}
            <code>hashCode</code> is spread with <code>h ^ (h &gt;&gt;&gt; 16)</code> — mixing high bits down,
            because the index is taken as <code>(capacity - 1) &amp; hash</code>, which uses only the low bits. That
            index selects a bucket. If it's empty, a node is stored. If not, the chain is walked, comparing hashes
            then <code>equals</code>: a match replaces the value, otherwise a node is appended. Since Java 8, a
            chain reaching 8 entries in a table of at least 64 converts to a red-black tree, bounding the worst case
            at O(log n) instead of O(n) — which was also a mitigation for hash-collision denial-of-service attacks.
            When size exceeds <code>capacity × 0.75</code> the table doubles and entries are redistributed, so{" "}
            <code>put</code> is amortised O(1). <code>get</code> follows the same path. It permits one null key
            (stored in bucket 0) and is not thread-safe.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "An array of buckets, indexed by (capacity - 1) & spreadHash — hence power-of-two capacities.",
          "The hash is spread with h ^ (h >>> 16) because only the low bits choose the bucket.",
          "Collisions form a chain that treeifies at 8 entries (table ≥ 64), bounding lookups at O(log n).",
          "Resize doubles the table above 75% occupancy and rehashes everything — pre-size large maps.",
          "A constant hashCode is legal and ruinous; iteration order is not something to depend on.",
        ]}
      />
    </>
  )
}
