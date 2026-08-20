import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"
import { StepFlowDiagram } from "@/components/diagram/step-flow-diagram"
import { Bell, UserPlus, Megaphone, Users, UserMinus } from "lucide-react"

const problem = `// The problem: when stock changes, several unrelated things must react
void restock(Product product, int quantity) {
    product.addStock(quantity);
    emailService.notifyWaitlist(product);      // the source now knows about
    searchIndex.update(product);               // email, search, analytics, ...
    analytics.record("restock", product);      // add a subscriber -> edit here
}

// Observer (behavioural): let interested parties REGISTER, and have the
// source notify all of them without knowing who or how many they are.`

const classic = `// The subject: keeps a list of observers and notifies them
interface StockObserver {
    void onStockChange(Product product);
}

class Product {
    private final List<StockObserver> observers = new CopyOnWriteArrayList<>();

    public void subscribe(StockObserver o)   { observers.add(o); }
    public void unsubscribe(StockObserver o) { observers.remove(o); }

    public void addStock(int quantity) {
        this.stock += quantity;
        for (StockObserver o : observers) {    // notify everyone, in ignorance
            o.onStockChange(this);
        }
    }
}

// Observers register themselves; Product never names them
product.subscribe(waitlistNotifier);
product.subscribe(searchIndex::update);        // a method reference is an observer
product.subscribe(p -> analytics.record("restock", p));`

const flow = `// Modern Java: Observer is a functional interface, so observers are lambdas.
// The reactive version (java.util.concurrent.Flow) formalises the same idea
// with backpressure:
interface Flow.Publisher<T>  { void subscribe(Flow.Subscriber<T> s); }
interface Flow.Subscriber<T> { void onNext(T item); void onError(Throwable t); ... }

// PropertyChangeListener (JavaBeans) and every Swing addXxxListener are
// Observer. So is a message broker's pub/sub at the system level.`

const pushVsPull = `// Push: the subject sends the changed data with the notification
void onStockChange(Product product, int newStock);   // observer gets the value

// Pull: the subject just says 'something changed', observer asks for details
void onStockChange(Product product);                  // observer calls product.stock()

// Push is simpler; pull decouples the observer from the exact shape of the
// change and lets each observer read only what it needs.`

export default function ObserverPatternLesson() {
  return (
    <>
      <p>
        Observer lets one object — the <strong>subject</strong> — notify many others when it changes, without
        knowing who they are. It's the pattern behind every listener API, the reactive streams in{" "}
        <code>java.util.concurrent.Flow</code>, and pub/sub messaging. It's also the pattern most likely to leak
        memory, which is half of why it's worth studying.
      </p>

      <CodeBlock language="text" filename="the problem" code={problem} />

      <h2>The classic form</h2>
      <CodeBlock language="java" filename="subject and observers" code={classic} />
      <p>
        The subject keeps a list of observers and, on any change, walks the list calling each one. It knows nothing
        about them beyond the interface — add a fifth observer and the subject's code is untouched. Note the{" "}
        <code>CopyOnWriteArrayList</code>: notification often runs while observers subscribe or unsubscribe, and
        that collection iterates a safe snapshot.
      </p>

      <h2>Subscribe, notify, unsubscribe</h2>
      <StepFlowDiagram
        title="The observer lifecycle"
        steps={[
          {
            id: "subscribe",
            label: "Observers subscribe",
            detail: "Each interested party registers itself with the subject. The subject adds it to a list and forgets everything else about it — it only knows the observer interface.",
            icon: UserPlus,
          },
          {
            id: "change",
            label: "The subject changes",
            detail: "Something happens — stock is added, a value is set. The subject's own state updates first.",
            icon: Bell,
          },
          {
            id: "notify",
            label: "Notify everyone",
            detail: "The subject iterates its observer list and calls each one, in ignorance of who they are or what they'll do. Order is usually unspecified.",
            icon: Megaphone,
            tone: "warning",
          },
          {
            id: "react",
            label: "Observers react independently",
            detail: "Each observer does its own thing — send an email, reindex, log — with no knowledge of the others. They're fully decoupled from each other and from the subject.",
            icon: Users,
          },
          {
            id: "unsubscribe",
            label: "Unsubscribe",
            detail: "An observer that no longer cares must remove itself. Skip this and the subject keeps it alive forever — the classic Observer memory leak.",
            icon: UserMinus,
            tone: "warning",
          },
        ]}
      />

      <h2>The modern and reactive forms</h2>
      <CodeBlock language="java" filename="lambdas and Flow" code={flow} />

      <h2>Push versus pull</h2>
      <CodeBlock language="java" filename="two ways to notify" code={pushVsPull} />

      <AnalogyCard title="A newsletter, not phoning each subscriber.">
        The publisher doesn't keep a mental list of who reads it or ring them individually — people subscribe, and
        every issue goes to whoever's on the list. Add a reader and the publisher does nothing differently. The one
        catch: if a reader moves and never cancels, the publisher keeps sending forever. That uncancelled
        subscription is precisely the Observer memory leak.
      </AnalogyCard>

      <Callout variant="warning" title="Observer is the classic memory leak">
        An observer registered with a long-lived subject stays reachable — and therefore uncollectable — until it
        unsubscribes. If it never does, it lives as long as the subject does, dragging everything it references with
        it. This is one of the most common leaks in long-running Java apps, and it's invisible in the source when
        the observer is a lambda capturing <code>this</code>.
      </Callout>

      <CommonMistake
        title="subscribing without ever unsubscribing"
        wrong={`class Dashboard {
    Dashboard(StockService service) {
        service.subscribe(product -> this.refresh(product));
    }
    // The lambda captures 'this'. The service holds the lambda.
    // The service outlives the dashboard, so every dashboard ever
    // opened is pinned in memory — a slow, invisible leak.
}`}
        right={`class Dashboard implements AutoCloseable {
    private final StockService service;
    private final StockObserver observer = this::refresh;

    Dashboard(StockService service) {
        this.service = service;
        service.subscribe(observer);
    }

    @Override public void close() {
        service.unsubscribe(observer);   // the last reference goes away
    }
}
// Keep a reference to the exact observer so you can remove it,
// and give the object a clear point at which it deregisters.`}
        explanation={
          <p>
            Two mistakes combine here: no unsubscribe path, and subscribing an anonymous lambda you can't later
            remove. Fix both — hold a reference to the observer so <code>unsubscribe</code> can target it, and give
            the object a lifecycle hook (like <code>AutoCloseable</code>) where it deregisters. Where you can't
            guarantee callers unsubscribe, a subject holding <code>WeakReference</code> observers is the fallback.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Observer is a subscribe/notify setup. Things that care about a change sign up with the thing that
            changes, and when it changes it tells all of them. It never needs to know who signed up — which is why
            you can add new listeners without touching it. Just remember to unsubscribe, or the listener never gets
            cleaned up.
          </p>
        }
        developer={
          <p>
            A subject maintains a collection of observers and notifies them on state change, decoupling it from
            concrete listeners and satisfying open/closed. Use a thread-safe collection (
            <code>CopyOnWriteArrayList</code>) since notification and (un)subscription interleave. Push versus pull
            trades notification simplicity against observer decoupling. The lifecycle hazard is that a registered
            observer is strongly reachable from the subject, so failing to unsubscribe leaks it — the reactive{" "}
            <code>Flow</code> API formalises the whole pattern with backpressure and explicit subscription
            management.
          </p>
        }
        interview={
          <p>
            Expect the memory-leak angle: an observer that never unsubscribes lives as long as the subject, and if
            it's a lambda capturing <code>this</code> the reference is invisible. The fixes are a deregistration
            path plus a held reference to the observer, or weak references. Also be ready to name it in the JDK —
            Swing listeners, <code>PropertyChangeListener</code>, <code>Flow.Subscriber</code> — and to note that a
            single-method observer is just a functional interface, so observers are lambdas.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why is Observer a frequent source of memory leaks?"
        options={[
          { id: "a", text: "Observers are always created with new, which is slow" },
          { id: "b", text: "A registered observer stays reachable from the subject until it unsubscribes, so forgetting to unsubscribe keeps it alive" },
          { id: "c", text: "The subject copies every observer, doubling memory" },
          { id: "d", text: "Notifications are stored in a queue that never clears" },
        ]}
        correctId="b"
        explanation="The subject holds a reference to each observer, so an observer that never unsubscribes can't be garbage-collected as long as the subject lives — dragging everything it references along too. It's especially insidious when the observer is a lambda capturing 'this', because the reference doesn't appear anywhere in the source."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Leak an observer, then plug it"
        hint={
          <p>
            Subscribe a large object to a long-lived subject with a <code>this</code>-capturing lambda, drop your
            reference to the object, force GC, and check it's still alive. Then add an unsubscribe.
          </p>
        }
      >
        Build a subject that outlives its observers. Register an observer that captures a big object, discard the
        observer reference, and show via a heap check that it can't be collected. Then give the observer an
        unsubscribe path and confirm it's reclaimed. That single experiment explains why every listener API needs a
        remove method.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="How does the Observer pattern work, and what's its main pitfall?"
        answer={
          <p>
            A <strong>subject</strong> keeps a list of <strong>observers</strong> and, whenever its state changes,
            notifies each one through a common interface. The subject knows nothing about the observers beyond that
            interface, so they're fully decoupled — you can add or remove listeners without changing the subject,
            which is the open/closed principle. Observers can be notified with the changed data (<em>push</em>) or
            just told that something changed and left to query the subject (<em>pull</em>). Java realises it as
            listener APIs (Swing, <code>PropertyChangeListener</code>), and{" "}
            <code>java.util.concurrent.Flow</code> is the reactive, backpressure-aware version. The main pitfall is
            memory leaks: because the subject holds a strong reference to every observer, an observer that never
            unsubscribes lives as long as the subject and keeps everything it references alive. This bites hardest
            when the observer is a lambda that captures <code>this</code>, since nothing in the code visibly points
            back. The fixes are a reliable deregistration path — often tied to a lifecycle hook like{" "}
            <code>AutoCloseable</code> — holding a reference to the exact observer so it can be removed, or having
            the subject store weak references. Notification also needs care around thread safety and observers that
            throw.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Observer: a subject notifies many observers of a change without knowing who they are.",
          "Add a listener by subscribing — the subject's code never changes.",
          "Use a thread-safe collection, since notification and (un)subscription interleave.",
          "Its signature pitfall is leaks: an observer that never unsubscribes lives as long as the subject.",
          "A single-method observer is a functional interface, and Flow is the reactive version.",
        ]}
      />
    </>
  )
}
