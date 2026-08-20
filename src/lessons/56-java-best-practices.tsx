import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"
import { TerminalDemo } from "@/components/lesson/terminal-demo"

const naming = `// Names carry more weight than comments, because they can't go stale
int d;                       ->  int daysUntilExpiry;
List<User> list;             ->  List<User> activeUsers;
void handle(Order o);        ->  void ship(Order order);
if (u.getT() == 1)           ->  if (user.role() == Role.ADMIN)

// Conventions everyone follows:
ClassNamesLikeThis
methodNamesAndVariables
CONSTANTS_LIKE_THIS
packages.all.lowercase
booleanMethods -> isActive(), hasPermission(), canShip()`

const nullHandling = `// 1. Fail fast at the boundary
public Order(String reference, Customer customer) {
    this.reference = Objects.requireNonNull(reference, "reference");
    this.customer = Objects.requireNonNull(customer, "customer");
}

// 2. Never return null for a collection — return an empty one
public List<Order> findByCustomer(String id) {
    return results == null ? List.of() : results;
}

// 3. Use Optional as a return type when "not found" is normal
public Optional<User> findByEmail(String email) { ... }

// 4. Put the literal on the left, or use Objects.equals
if ("ADMIN".equals(role)) { ... }
if (Objects.equals(a, b)) { ... }`

const immutability = `// Default to immutable and relax only when you must
public record Money(long amountPence, Currency currency) {
    public Money {
        if (amountPence < 0) throw new IllegalArgumentException("negative");
    }
    public Money plus(Money other) {          // returns a NEW value
        return new Money(amountPence + other.amountPence, currency);
    }
}

// Benefits you get for free: thread safety, safe sharing without copies,
// valid-by-construction, and usable as a map key.

// When a class must be mutable, keep the mutable window small:
private final List<Item> items = new ArrayList<>();   // final field
public List<Item> items() { return List.copyOf(items); }   // no leak`

const pitfalls = `Pitfall                              Fix
----------------------------------   ------------------------------------------
== on Strings or wrappers            equals, or Objects.equals
Overriding equals but not hashCode   override both, from the same final fields
Mutating a key already in a map      base identity on immutable fields
Catching Exception or Throwable      catch the specific type you can handle
Empty catch block                    log with context, or rethrow wrapped
Building strings in a loop with +    StringBuilder
Unbounded caches and collections     bound them, or use eviction
double for money                     BigDecimal, or long minor units
Ignoring InterruptedException        restore the flag and stop
Sharing HashMap between threads      ConcurrentHashMap
Not closing files and streams        try-with-resources
Nested loops over a List for lookup  build a Map first
Optional as a field or parameter     use it as a return type only`

const methodDesign = `// Long methods are the most common design problem in Java
public void processOrder(Order order) {     // 120 lines
    // validate...
    // calculate tax...
    // apply discounts...
    // charge the card...
    // send the email...
}

// Extract until each method does one thing, at one level of abstraction
public void processOrder(Order order) {
    validate(order);
    var invoice = priceOrder(order);
    var payment = charge(invoice);
    notify(order.customer(), payment);
}

// The rewritten version reads like the description of the process,
// and each step can be tested and changed on its own.`

const performance = `// The order in which to care:
// 1. Choose the right data structure     — O(n) to O(1) beats every micro-optimisation
// 2. Avoid doing the work at all         — cache, batch, filter earlier
// 3. Measure                             — JMH, a profiler, or timing with warm-up
// 4. Only then, optimise the hot path

// The classic accidental O(n^2):
for (Order order : orders) {
    if (customerList.contains(order.customerId())) { ... }   // O(n) inside O(n)
}

Set<String> customers = new HashSet<>(customerList);          // once, O(n)
for (Order order : orders) {
    if (customers.contains(order.customerId())) { ... }       // O(1) each
}`

export default function JavaBestPracticesLesson() {
  return (
    <>
      <p>
        This last lesson is the collected advice from everything before it: the habits that separate Java you're
        glad to inherit from Java you dread, plus a cheat sheet for diagnosing the failures you'll actually meet.
      </p>

      <h2>Names do the documenting</h2>
      <CodeBlock language="java" filename="naming" code={naming} />
      <p>
        A comment explaining what a badly named variable holds is a comment that will be wrong within six months. A
        good name can't drift out of date, because changing the name is changing the code.
      </p>

      <h2>Handle null at the edges</h2>
      <CodeBlock language="java" filename="four rules" code={nullHandling} />
      <Callout variant="tip" title="Validate on the way in, not everywhere">
        If a constructor rejects null, nothing downstream needs to check. Scattered null checks are usually a
        symptom of one missing check at the boundary — and they hide the real question, which is whether null was
        ever a legitimate value there.
      </Callout>

      <h2>Prefer immutability</h2>
      <CodeBlock language="java" filename="default to values" code={immutability} />

      <AnalogyCard title="Writing in pen.">
        Mutable objects are pencil: convenient, and you can never be sure the number you read a moment ago is still
        there. Immutable ones are pen — to change something you write a new line, and every old line stays exactly
        as it was. It's slightly more effort per change, and it removes an entire class of "who modified this?"
        investigations.
      </AnalogyCard>

      <h2>Keep methods short and at one level</h2>
      <CodeBlock language="java" filename="extract until it reads as a summary" code={methodDesign} />

      <h2>The pitfall cheat sheet</h2>
      <CodeBlock language="text" filename="everything this course warned about" code={pitfalls} />

      <h2>Performance, in the right order</h2>
      <CodeBlock language="java" filename="algorithms before micro-optimisation" code={performance} />

      <h2>Diagnosing a running JVM</h2>
      <TerminalDemo
        title="The commands to know when something is wrong in production"
        prompt="~"
        steps={[
          {
            command: "jps -l",
            output: ["48211 com.example.billing.Application", "48302 jdk.jcmd/sun.tools.jps.Jps"],
            note: "Lists running JVMs and their main classes. Everything else needs the process id from here.",
          },
          {
            command: "jstack 48211 | grep -A 5 'BLOCKED'",
            output: [
              '"http-nio-8080-exec-3" #34 waiting for monitor entry',
              "   java.lang.Thread.State: BLOCKED (on object monitor)",
              "        at com.example.OrderService.process(OrderService.java:88)",
              "        - waiting to lock <0x000000071ab2c1f8> (a java.lang.Object)",
            ],
            note: "A thread dump. Threads BLOCKED on the same monitor point straight at contention; two threads each waiting for a lock the other holds is a deadlock.",
          },
          {
            command: "jcmd 48211 GC.heap_info",
            output: [
              " garbage-first heap   total 2097152K, used 1998233K",
              "  region size 1024K, 1902 young (1947648K), 12 survivors",
            ],
            note: "Used sitting near total, and staying there after collections, means a leak rather than a busy moment.",
          },
          {
            command: "jmap -dump:live,format=b,file=heap.hprof 48211",
            output: ["Heap dump file created [1284993027 bytes]"],
            note: "The dump to open in Eclipse MAT or VisualVM. Look at the dominator tree, find the biggest retainer, then follow its path to a GC root — that path is your leak.",
          },
        ]}
      />

      <CommonMistake
        title="premature optimisation instead of the right data structure"
        wrong={`// Micro-optimising a loop that is O(n^2) because of the lookup
for (int i = 0, size = orders.size(); i < size; i++) {   // caching size()
    Order order = orders.get(i);
    for (Customer c : customers) {                       // the real problem
        if (c.id().equals(order.customerId())) { ... }
    }
}`}
        right={`Map<String, Customer> byId = customers.stream()
        .collect(toMap(Customer::id, c -> c));

for (Order order : orders) {
    Customer customer = byId.get(order.customerId());     // O(1)
    ...
}`}
        explanation={
          <p>
            Hoisting <code>size()</code> out of the loop saves nanoseconds; replacing a nested scan with a map
            lookup turns a million operations into a thousand. Complexity dominates constants at any meaningful
            scale, so the data structure is always the first thing to look at — and usually the last thing you need
            to change.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Name things so the code explains itself. Check inputs once, where they arrive. Prefer objects that can't
            change. Keep methods short enough to read in one go. And when something is slow, look at what data
            structure you chose before anything else.
          </p>
        }
        developer={
          <p>
            Validate at construction with <code>Objects.requireNonNull</code>, return empty collections rather than
            null, and use <code>Optional</code> only as a return type. Default to <code>final</code> fields and
            records; expose operations rather than setters. Catch specific exceptions, always chain the cause, and
            never swallow <code>InterruptedException</code>. For diagnosis: <code>jps</code>,{" "}
            <code>jstack</code> for thread states and deadlocks, <code>jcmd</code> for heap and GC information, and
            a heap dump analysed for its dominator tree and path to GC root.
          </p>
        }
        interview={
          <p>
            "How would you debug high memory usage in production?" is an extremely common question. The answer:
            confirm it's a leak rather than load by checking whether used heap falls after a full GC (
            <code>-Xlog:gc</code> or <code>jcmd GC.heap_info</code>); take a heap dump with{" "}
            <code>jmap</code>; open it in Eclipse MAT; use the dominator tree to find what's retaining most; and
            follow the path to GC root to find the reference that shouldn't exist — typically a static collection,
            an unremoved listener, or a <code>ThreadLocal</code> in a pooled thread.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="A service's heap usage climbs steadily and never falls, eventually causing OutOfMemoryError. What is the most informative first step?"
        options={[
          { id: "a", text: "Increase -Xmx and restart" },
          { id: "b", text: "Take a heap dump and find the largest retainer and its path to a GC root" },
          { id: "c", text: "Call System.gc() periodically" },
          { id: "d", text: "Switch to a different garbage collector" },
        ]}
        correctId="b"
        explanation="Steadily climbing usage that survives collection means something reachable is accumulating — a leak, which a bigger heap only postpones. The dump tells you which object is retaining the memory and, via the path to GC root, exactly which reference is keeping it alive."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Audit your own code"
        hint={
          <p>
            Search for <code>catch (Exception</code>, <code>== null</code> repeated in several methods, methods
            longer than a screen, and <code>+=</code> on a String inside a loop.
          </p>
        }
      >
        Take something you wrote earlier in this course and run down the pitfall table against it. Fix the three
        worst findings, and for each one write a sentence on what would have gone wrong if it had shipped. Then add
        a test that would have caught it.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="How would you investigate a Java service that is using too much memory?"
        answer={
          <p>
            First establish whether it's a leak or just load: enable GC logging (<code>-Xlog:gc</code>) or run{" "}
            <code>jcmd &lt;pid&gt; GC.heap_info</code> and look at whether used heap drops after full collections.
            Steadily climbing usage that survives GC means objects are still reachable, which is a leak; high but
            stable usage means the application genuinely needs that much. For a leak, take a heap dump with{" "}
            <code>jmap -dump:live,format=b,file=heap.hprof &lt;pid&gt;</code> and open it in Eclipse MAT. The
            dominator tree shows which objects retain the most memory, and the "path to GC root" for the biggest
            retainer identifies the reference that shouldn't still exist. In my experience that's almost always one
            of four things: a static collection or cache with no eviction, listeners registered and never removed, a{" "}
            <code>ThreadLocal</code> set on a pooled thread and never cleared, or an inner class pinning its
            enclosing instance. The fix is to remove the reference or bound the collection — increasing{" "}
            <code>-Xmx</code> only buys time.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Names are documentation that can't go stale — spend the effort there rather than on comments.",
          "Validate at the boundary with requireNonNull; return empty collections, never null.",
          "Default to immutable: final fields, records, and operations instead of setters.",
          "Fix the data structure before micro-optimising — complexity beats constants at any real scale.",
          "For production problems: jps, jstack for threads and deadlocks, jcmd for heap, jmap plus MAT for leaks.",
        ]}
      />
    </>
  )
}
