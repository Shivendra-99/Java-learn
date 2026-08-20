import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { MemoryDiagram } from "@/components/diagram/memory-diagram"
import { OutputPredictor } from "@/components/lesson/output-predictor"
import { Quiz } from "@/components/lesson/quiz"

const clazz = `public class BankAccount {

    // Fields: the state each object remembers
    private final String owner;
    private long balancePence;

    // Constructor: how a valid object comes into existence
    public BankAccount(String owner, long openingPence) {
        this.owner = owner;
        this.balancePence = openingPence;
    }

    // Behaviour: what an object can do, expressed in terms of its own state
    public void deposit(long pence) {
        if (pence <= 0) throw new IllegalArgumentException("deposit must be positive");
        balancePence += pence;
    }

    public boolean withdraw(long pence) {
        if (pence > balancePence) return false;
        balancePence -= pence;
        return true;
    }

    public long balance() {
        return balancePence;
    }
}`

const usage = `BankAccount alice = new BankAccount("Alice", 10_000);
BankAccount bob   = new BankAccount("Bob", 250);

alice.deposit(5_000);
System.out.println(alice.balance());   // 15000
System.out.println(bob.balance());     // 250  — completely unaffected

// Two objects, two separate copies of every instance field.`

const thisKeyword = `public class Point {
    private int x;
    private int y;

    public Point(int x, int y) {
        this.x = x;      // this.x is the field, x is the parameter
        this.y = y;
    }

    public Point moveBy(int dx, int dy) {
        this.x += dx;
        return this;     // returning this enables chaining: p.moveBy(1,1).moveBy(2,2)
    }
}`

const nullPredictor = `public class Boxes {
    static class Box {
        String label = "empty";
    }

    public static void main(String[] args) {
        Box a = new Box();
        Box b = a;
        b.label = "full";
        a = null;
        System.out.println(b.label);
    }
}`

export default function ClassesAndObjectsLesson() {
  return (
    <>
      <p>
        A class describes a kind of thing: what it knows and what it can do. An object is one actual instance of
        that description, with its own copy of everything the class said it would remember. The distinction sounds
        abstract until you watch <code>new</code> run — so that's what we'll do.
      </p>

      <h2>A class, in full</h2>
      <CodeBlock language="java" filename="BankAccount.java" code={clazz} />
      <p>
        Three parts, and they answer three questions. <strong>Fields</strong>: what does one of these remember?{" "}
        <strong>Constructor</strong>: what must be true before one exists? <strong>Methods</strong>: what can it be
        asked to do? Notice that the methods are written in terms of the object's own fields — that's what makes
        this a class rather than a bag of functions.
      </p>

      <h2>Each object has its own state</h2>
      <CodeBlock language="java" filename="two accounts" code={usage} />

      <h2>What new actually does</h2>
      <MemoryDiagram
        title="Creating and using two objects"
        steps={[
          {
            label: "BankAccount alice = new BankAccount(\"Alice\", 10000);",
            detail:
              "new allocates space on the heap for one BankAccount, runs the constructor to fill in its fields, and returns the reference that alice now holds.",
            stack: [{ id: "main", label: "main()", vars: [{ name: "alice", ref: "acc@1" }] }],
            heap: [
              { id: "acc@1", type: "BankAccount", fields: [["owner", "\"Alice\""], ["balancePence", "10000"]], tone: "new" },
            ],
          },
          {
            label: "BankAccount bob = new BankAccount(\"Bob\", 250);",
            detail: "A second, entirely separate object. Same class, same fields, different values — and no connection to the first.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "alice", ref: "acc@1" },
                  { name: "bob", ref: "acc@2" },
                ],
              },
            ],
            heap: [
              { id: "acc@1", type: "BankAccount", fields: [["owner", "\"Alice\""], ["balancePence", "10000"]] },
              { id: "acc@2", type: "BankAccount", fields: [["owner", "\"Bob\""], ["balancePence", "250"]], tone: "new" },
            ],
          },
          {
            label: "alice.deposit(5000);",
            detail:
              "The method runs with 'this' bound to acc@1, so balancePence += 5000 changes that object only. bob's field is untouched.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "alice", ref: "acc@1" },
                  { name: "bob", ref: "acc@2" },
                ],
              },
              { id: "dep", label: "deposit(long)", vars: [{ name: "this", ref: "acc@1" }, { name: "pence", value: "5000" }] },
            ],
            heap: [
              { id: "acc@1", type: "BankAccount", fields: [["owner", "\"Alice\""], ["balancePence", "15000"]], tone: "new" },
              { id: "acc@2", type: "BankAccount", fields: [["owner", "\"Bob\""], ["balancePence", "250"]] },
            ],
          },
          {
            label: "alice = null;",
            detail:
              "The variable no longer points anywhere. Nothing else references acc@1, so it becomes unreachable and the garbage collector may reclaim it — the object was not 'deleted' by the assignment.",
            stack: [
              {
                id: "main",
                label: "main()",
                vars: [
                  { name: "alice", isNull: true },
                  { name: "bob", ref: "acc@2" },
                ],
              },
            ],
            heap: [
              { id: "acc@1", type: "BankAccount", fields: [["owner", "\"Alice\""], ["balancePence", "15000"]], tone: "garbage" },
              { id: "acc@2", type: "BankAccount", fields: [["owner", "\"Bob\""], ["balancePence", "250"]] },
            ],
          },
        ]}
      />

      <AnalogyCard title="A blueprint and the houses built from it.">
        The blueprint says every house has an address, a number of rooms, and a front door that can be opened. It
        isn't a house — nobody lives in a blueprint. Build from it twice and you get two houses that can be painted
        different colours without affecting each other. Change the blueprint and future houses differ; the ones
        already standing don't.
      </AnalogyCard>

      <h2>this</h2>
      <CodeBlock language="java" filename="the this reference" code={thisKeyword} />
      <p>
        Inside an instance method, <code>this</code> is the object the method was called on. You mostly need it to
        disambiguate a field from a parameter with the same name — which is the norm in constructors and setters.
        Returning <code>this</code> is how fluent, chainable APIs are built.
      </p>

      <h2>References, not objects</h2>
      <OutputPredictor
        code={nullPredictor}
        options={[
          { id: "a", text: "empty" },
          { id: "b", text: "full" },
          { id: "c", text: "null" },
          { id: "d", label: "It throws NullPointerException", text: "" },
        ]}
        correctId="b"
        explanation={
          <p>
            <code>b = a</code> copied the reference, so both variables pointed at one object, and{" "}
            <code>b.label = "full"</code> changed that object. Setting <code>a = null</code> only clears{" "}
            <code>a</code>'s slot — it doesn't destroy anything, and <code>b</code> still refers to a perfectly
            healthy object. Java has no way to delete an object; you can only stop referring to it.
          </p>
        }
      />

      <Callout variant="info" title="Objects have identity, state, and behaviour">
        <strong>Identity</strong> — two accounts with identical balances are still two different objects.{" "}
        <strong>State</strong> — the current values of its fields. <strong>Behaviour</strong> — the methods it
        offers. Most design questions in Java come down to deciding which of the three you actually care about.
      </Callout>

      <CommonMistake
        title="a class that is only data, with the logic living elsewhere"
        wrong={`class Account {
    public long balance;     // public field, no rules
}

// The logic ends up scattered, and every caller must remember it
if (account.balance >= amount) {
    account.balance -= amount;
} else {
    throw new IllegalStateException("insufficient funds");
}`}
        right={`class Account {
    private long balance;

    public void withdraw(long amount) {
        if (amount > balance) {
            throw new IllegalStateException("insufficient funds");
        }
        balance -= amount;
    }
}

account.withdraw(amount);   // the rule lives with the data`}
        explanation={
          <p>
            When the data is public and the rules live in callers, every new caller is a chance to forget one — and
            you can never be sure the balance is valid, because anything can assign to it. Putting the operation on
            the class means the rule is enforced once, in the only place that can change the field. That's the
            practical argument for encapsulation, which the next lessons build on.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A class is a description; an object is a real thing made from that description. Each object keeps its
            own values, so changing one doesn't touch another. A variable doesn't hold the object itself — it holds
            a pointer to it, which is why two variables can end up referring to the same object.
          </p>
        }
        developer={
          <p>
            <code>new</code> allocates on the heap, zeroes the fields to their defaults, runs field initialisers and
            instance blocks, runs the constructor, and yields a reference. Instance fields belong to the object;
            local variables and the reference itself live in the stack frame. There is no destructor and no{" "}
            <code>delete</code>: an object becomes eligible for collection when no live thread can reach it, which
            makes object lifetime a property of reachability rather than scope.
          </p>
        }
        interview={
          <p>
            Be precise about the distinction between a reference and an object: assigning one reference to another
            aliases, passing a reference to a method passes a copy of the reference, and setting a variable to{" "}
            <code>null</code> affects only that variable. If asked "how do you destroy an object in Java?" the
            answer is that you don't — you drop the last reference to it and let the collector decide.{" "}
            <code>finalize()</code> is deprecated for removal and should never appear in an answer as a
            recommendation.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Two variables refer to the same object. What happens to the object when one of them is set to null?"
        options={[
          { id: "a", text: "The object is destroyed immediately" },
          { id: "b", text: "Nothing happens to the object — the other variable still refers to it" },
          { id: "c", text: "The other variable also becomes null" },
          { id: "d", text: "The garbage collector runs immediately" },
        ]}
        correctId="b"
        explanation="Assigning null changes one variable's slot, not the object. The object only becomes eligible for collection when nothing reachable refers to it — and even then, when it is actually reclaimed is up to the collector."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Model something you know"
        hint={
          <p>
            Start with the question "what must always be true about one of these?" and let the answers become
            validation inside the constructor and the methods.
          </p>
        }
      >
        Write a <code>Playlist</code> class with a name and a list of track titles, plus methods to add a track,
        remove one, and report the length. Make it impossible to create a playlist with a blank name, and
        impossible for outside code to modify the track list directly. Then create two playlists and prove they're
        independent.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the difference between a class, an object, and a reference?"
        answer={
          <p>
            A <strong>class</strong> is a compile-time description — fields, constructors, methods — loaded once by
            the class loader. An <strong>object</strong> is a runtime instance of that description, allocated on the
            heap with its own copy of every instance field. A <strong>reference</strong> is a variable that holds
            the address of an object; it lives in a stack frame or inside another object. Several references can
            point at one object (aliasing), a reference can point at nothing (<code>null</code>), and an object with
            no references left becomes eligible for garbage collection. The confusion people run into — "I set it to
            null but the other variable still works" — dissolves once these three are kept separate.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "A class describes; an object is one instance with its own copy of every instance field.",
          "new allocates on the heap, runs the constructor, and returns a reference.",
          "Variables hold references, not objects — assignment aliases rather than copies.",
          "this is the object the current instance method was called on; returning it enables chaining.",
          "You never delete an object; you drop the last reference and let the collector reclaim it.",
        ]}
      />
    </>
  )
}
