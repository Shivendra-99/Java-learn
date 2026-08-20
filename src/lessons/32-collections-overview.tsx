import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"
import { TypeHierarchyDiagram } from "@/components/diagram/type-hierarchy-diagram"

const choosing = `What do you need?                          Use
--------------------------------------     ------------------------------
Ordered, duplicates allowed, index access  ArrayList
Queue at both ends / stack                 ArrayDeque
No duplicates, order irrelevant            HashSet
No duplicates, insertion order kept        LinkedHashSet
No duplicates, sorted                      TreeSet
Key to value, order irrelevant             HashMap
Key to value, insertion order kept         LinkedHashMap
Key to value, sorted by key                TreeMap
Enum keys                                  EnumMap / EnumSet
Shared between threads                     ConcurrentHashMap, CopyOnWriteArrayList
Never changes                              List.of / Set.of / Map.of`

const commonApi = `// Collection — the operations almost everything supports
collection.add(e);
collection.remove(e);
collection.contains(e);
collection.size();
collection.isEmpty();
collection.clear();
collection.iterator();
collection.stream();
collection.forEach(System.out::println);
collection.removeIf(e -> e.isExpired());

// Creating
List<String> mutable = new ArrayList<>();
List<String> copy = new ArrayList<>(other);
List<String> fixed = List.of("a", "b");          // immutable, rejects null
List<String> view = Arrays.asList(array);        // fixed size, writes through to the array`

const immutableTraps = `List<String> fixed = List.of("a", "b");
fixed.add("c");            // UnsupportedOperationException
fixed.contains(null);      // NullPointerException — List.of rejects nulls entirely

List<String> view = Arrays.asList("a", "b");
view.set(0, "z");          // OK — set is allowed
view.add("c");             // UnsupportedOperationException — size is fixed

// To get a genuinely mutable copy of either:
List<String> real = new ArrayList<>(List.of("a", "b"));`

const iteration = `List<String> names = List.of("Ana", "Ben", "Cara");

for (String name : names) { ... }              // the default
names.forEach(name -> log(name));              // fine, but harder to debug/break
for (int i = 0; i < names.size(); i++) { ... } // when you need the index

Iterator<String> it = names.iterator();        // when you need to remove
while (it.hasNext()) {
    if (it.next().isBlank()) it.remove();
}

names.stream().filter(...).toList();           // when you are transforming`

export default function CollectionsOverviewLesson() {
  return (
    <>
      <p>
        The collections framework is the part of the standard library you'll use every day. It looks large, but
        it's really three interfaces — <code>List</code>, <code>Set</code>, <code>Map</code> — plus a handful of
        implementations that trade off differently. Learn the shape of the hierarchy and choosing becomes
        mechanical.
      </p>

      <TypeHierarchyDiagram
        title="The map you should keep in your head"
        initialSelected="collection"
        nodes={[
          {
            id: "iterable",
            name: "Iterable<E>",
            kind: "interface",
            tag: "for-each works",
            detail: "Declares iterator(). Anything implementing it can be used in an enhanced for loop — that is the entire contract.",
          },
          {
            id: "collection",
            name: "Collection<E>",
            kind: "interface",
            parent: "iterable",
            tag: "add, remove, contains, size",
            detail:
              "The common vocabulary for a group of elements. Take a Collection as a parameter when you genuinely don't care about ordering or uniqueness — it is the most accommodating type you can accept.",
          },
          {
            id: "list",
            name: "List<E>",
            kind: "interface",
            parent: "collection",
            tag: "ordered, duplicates OK",
            detail: "Elements have positions, so get(i) and index-based insertion exist. Duplicates are allowed. This is the default choice for a sequence.",
          },
          {
            id: "arraylist",
            name: "ArrayList<E>",
            kind: "class",
            parent: "list",
            tag: "O(1) get",
            detail: "A growable array. Fast random access and fast iteration; inserting or removing in the middle shifts elements. Use this unless you have a measured reason not to.",
          },
          {
            id: "linkedlist",
            name: "LinkedList<E>",
            kind: "class",
            parent: "list",
            tag: "O(n) get",
            detail:
              "A doubly-linked list. O(1) insertion once you're at a position, but get(i) has to walk. Its real use is as a Deque, and even there ArrayDeque is usually faster.",
          },
          {
            id: "set",
            name: "Set<E>",
            kind: "interface",
            parent: "collection",
            tag: "no duplicates",
            detail: "At most one of each element, decided by equals and hashCode. No positions, so there is no get(i).",
          },
          {
            id: "hashset",
            name: "HashSet<E>",
            kind: "class",
            parent: "set",
            tag: "O(1), unordered",
            detail: "Backed by a HashMap. Constant-time contains, and iteration order is arbitrary and may change between runs — never depend on it.",
          },
          {
            id: "linkedhashset",
            name: "LinkedHashSet<E>",
            kind: "class",
            parent: "hashset",
            tag: "insertion order",
            detail: "A HashSet that also threads a linked list through the entries, so iteration follows insertion order. Slightly more memory for predictable output.",
          },
          {
            id: "treeset",
            name: "TreeSet<E>",
            kind: "class",
            parent: "set",
            tag: "sorted, O(log n)",
            detail:
              "A red-black tree ordered by Comparable or a Comparator. Adds range operations — first, last, headSet, ceiling. Note it uses compareTo, not equals, to decide duplicates.",
          },
          {
            id: "queue",
            name: "Queue<E> / Deque<E>",
            kind: "interface",
            parent: "collection",
            tag: "ends, not indices",
            detail:
              "Add and remove at the ends. ArrayDeque is the general-purpose implementation and is the right way to write a stack; PriorityQueue orders by priority rather than arrival.",
          },
          {
            id: "map",
            name: "Map<K, V>",
            kind: "interface",
            tag: "not a Collection",
            detail:
              "Deliberately outside the Collection hierarchy, because it holds pairs rather than elements. You can view its parts as collections: keySet(), values(), entrySet().",
          },
          {
            id: "hashmap",
            name: "HashMap<K, V>",
            kind: "class",
            parent: "map",
            tag: "O(1), unordered",
            detail: "The default map. Keys must have sensible equals and hashCode. Permits one null key and any number of null values.",
          },
          {
            id: "linkedhashmap",
            name: "LinkedHashMap<K, V>",
            kind: "class",
            parent: "hashmap",
            tag: "insertion or access order",
            detail: "Predictable iteration order, and with access-order mode plus removeEldestEntry it becomes an LRU cache in a few lines.",
          },
          {
            id: "treemap",
            name: "TreeMap<K, V>",
            kind: "class",
            parent: "map",
            tag: "sorted keys",
            detail: "Sorted by key with O(log n) operations, plus navigation: floorKey, ceilingKey, subMap, firstEntry. Does not allow a null key.",
          },
        ]}
      />

      <h2>Choosing, in one table</h2>
      <CodeBlock language="text" filename="pick by requirement" code={choosing} />

      <AnalogyCard title="A list, a guest list, and a phone book.">
        A shopping list keeps order and doesn't mind two entries of milk — that's a <code>List</code>. A guest list
        cares only whether you're on it, and adding someone twice changes nothing — a <code>Set</code>. A phone book
        maps a name to a number and you look up by name, never by position — a <code>Map</code>. Almost every
        collection decision is choosing between those three sentences.
      </AnalogyCard>

      <h2>The shared API</h2>
      <CodeBlock language="java" filename="Collection basics" code={commonApi} />

      <h2>Immutable and fixed-size collections</h2>
      <CodeBlock language="java" filename="three different 'unmodifiable's" code={immutableTraps} />
      <Callout variant="warning" title="List.of is not just an unmodifiable ArrayList">
        It rejects <code>null</code> everywhere — including in <code>contains(null)</code>, which throws rather than
        returning false. <code>Arrays.asList</code> is different again: fixed size but writable, and backed by the
        original array. And <code>Collections.unmodifiableList</code> is a read-only <em>view</em>, so changes to the
        underlying list still show through.
      </Callout>

      <h2>Ways to iterate</h2>
      <CodeBlock language="java" filename="pick the simplest that works" code={iteration} />

      <CommonMistake
        title="declaring the concrete type instead of the interface"
        wrong={`private HashMap<String, User> users = new HashMap<>();

public ArrayList<Order> findOrders(HashSet<String> ids) { ... }`}
        right={`private Map<String, User> users = new HashMap<>();

public List<Order> findOrders(Set<String> ids) { ... }`}
        explanation={
          <p>
            Declaring the interface means you can switch to <code>LinkedHashMap</code> for predictable ordering, or{" "}
            <code>ConcurrentHashMap</code> for thread safety, by changing one line. Declaring the class makes that
            decision part of your API, so every caller has to change with you. Accept the widest type that works —
            often <code>Collection</code> — and return the narrowest that's useful.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Three main shapes: a <code>List</code> keeps things in order and allows repeats, a <code>Set</code>{" "}
            keeps only one of each, and a <code>Map</code> links keys to values. Each has a few implementations that
            differ in speed and whether they keep any order.
          </p>
        }
        developer={
          <p>
            <code>Collection</code> is the root for element groups; <code>Map</code> deliberately isn't one.
            Implementations differ in backing structure — resizable array, linked nodes, hash table, red-black tree
            — which determines complexity and iteration order. Hash-based types need correct{" "}
            <code>equals</code>/<code>hashCode</code>; tree-based types need <code>Comparable</code> or a{" "}
            <code>Comparator</code> and use comparison, not equality, to detect duplicates. Most implementations are
            fail-fast on concurrent modification.
          </p>
        }
        interview={
          <p>
            Expect "when would you use X over Y". Have crisp answers: <code>ArrayList</code> unless you're
            constantly adding at the ends (<code>ArrayDeque</code>); <code>HashMap</code> unless you need ordering (
            <code>LinkedHashMap</code>) or sorting (<code>TreeMap</code>); <code>HashSet</code> unless you need the
            same. Also be ready for why <code>Map</code> isn't a <code>Collection</code> — its elements are pairs,
            and <code>add(E)</code> has no sensible meaning for it.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why is Map not a subinterface of Collection?"
        options={[
          { id: "a", text: "For historical reasons only — it was an oversight" },
          { id: "b", text: "Because a Map holds key-value pairs, so Collection's element-based methods like add(E) have no sensible meaning" },
          { id: "c", text: "Because maps are not iterable" },
          { id: "d", text: "Because Map came later, in Java 5" },
        ]}
        correctId="b"
        explanation="Collection is about single elements: add(E), contains(E), iterator() over E. A Map's unit is a pair, so those signatures don't fit. Instead it offers collection views — keySet(), values(), entrySet() — which is how you iterate one."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Watch iteration order change"
        hint={
          <p>
            Add the same strings to a <code>HashSet</code>, a <code>LinkedHashSet</code> and a{" "}
            <code>TreeSet</code>, then print each.
          </p>
        }
      >
        Insert ten strings in a deliberately jumbled order into all three set implementations and print them.
        Note which gives insertion order, which gives sorted order, and which gives something that looks random but
        is stable within a run. Then explain why depending on the third one's order in a test would be a bad idea.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="How do you decide which collection implementation to use?"
        answer={
          <p>
            Start with the interface the problem needs: a sequence with positions and duplicates is a{" "}
            <code>List</code>, uniqueness is a <code>Set</code>, key lookup is a <code>Map</code>. Then pick the
            implementation from two questions: what ordering do I need, and what operations dominate?{" "}
            <code>ArrayList</code> is the default list because random access and iteration are fast and insertion at
            the end is amortised constant; <code>LinkedList</code> only pays off for heavy insertion or removal
            through an iterator, and even as a queue <code>ArrayDeque</code> usually beats it.{" "}
            <code>HashMap</code>/<code>HashSet</code> are the defaults for lookup; use the{" "}
            <code>Linked</code> variants when iteration order must be predictable, and the <code>Tree</code>{" "}
            variants when you need sorting or range queries and can afford O(log n). If it's shared across threads,
            that overrides everything: <code>ConcurrentHashMap</code> rather than a synchronised wrapper.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Three shapes: List (ordered, duplicates), Set (unique), Map (key to value, not a Collection).",
          "ArrayList, HashMap and HashSet are the defaults — deviate for ordering, sorting, or concurrency.",
          "Linked variants preserve insertion order; Tree variants sort and add range operations.",
          "List.of rejects nulls, Arrays.asList is fixed-size but writable, unmodifiable wrappers are live views.",
          "Declare variables and parameters with the interface type, not the implementation.",
        ]}
      />
    </>
  )
}
