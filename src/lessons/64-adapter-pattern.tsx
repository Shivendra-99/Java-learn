import { AnalogyCard } from "@/components/lesson/analogy-card"
import { Callout } from "@/components/lesson/callout"
import { Challenge } from "@/components/lesson/challenge"
import { CodeBlock } from "@/components/lesson/code-block"
import { CommonMistake } from "@/components/lesson/common-mistake"
import { DifficultyLevels } from "@/components/lesson/difficulty-levels"
import { InterviewQuestion } from "@/components/lesson/interview-question"
import { KeyTakeaways } from "@/components/lesson/key-takeaways"
import { Quiz } from "@/components/lesson/quiz"

const problem = `// The problem: your code speaks one interface, the library speaks another
interface PaymentProcessor {                 // what YOUR code calls
    PaymentResult charge(long amountPence, String reference);
}

class StripeApi {                            // what the LIBRARY offers
    StripeCharge createCharge(int cents, String currency, Map<String,String> meta) { ... }
}
// You can't change StripeApi, and you don't want your whole codebase
// to depend on its shape. The two interfaces are incompatible.

// Adapter (structural): wrap the library in an object that presents
// the interface YOUR code expects.`

const adapter = `class StripeAdapter implements PaymentProcessor {   // YOUR interface
    private final StripeApi stripe;                 // holds the ADAPTEE

    StripeAdapter(StripeApi stripe) { this.stripe = stripe; }

    @Override
    public PaymentResult charge(long amountPence, String reference) {
        // translate the call from your world into Stripe's world
        StripeCharge charge = stripe.createCharge(
                (int) amountPence,               // pence -> cents (both minor units here)
                "GBP",
                Map.of("ref", reference));
        // translate the result back
        return charge.isPaid()
                ? PaymentResult.success(charge.getId())
                : PaymentResult.declined();
    }
}

// Now the rest of your code depends only on PaymentProcessor.
// Swap Stripe for another provider = write one new adapter.
PaymentProcessor processor = new StripeAdapter(new StripeApi());
processor.charge(4200, "ORDER-1");`

const jdk = `// Adapters in the JDK

// Arrays.asList adapts an array to the List interface
List<String> list = Arrays.asList(array);       // array wearing a List's shape

// InputStreamReader adapts a byte stream to a character stream
Reader reader = new InputStreamReader(inputStream, UTF_8);   // bytes -> chars

// Collections.list adapts a legacy Enumeration to a List
List<T> list = Collections.list(enumeration);`

const adapterVsDecorator = `Adapter                            Decorator
--------------------------------   ------------------------------------------
CHANGES the interface              KEEPS the same interface
makes incompatible things fit      adds behaviour to compatible things
usually one, at a boundary         often stacked, many at once
'translate A to B'                 'enhance B, still a B'

// Both wrap an object. The question is: does the wrapper present a
// DIFFERENT interface (Adapter) or the SAME one (Decorator/Proxy)?`

export default function AdapterPatternLesson() {
  return (
    <>
      <p>
        Adapter makes two incompatible interfaces work together by wrapping one object in another that presents the
        shape the caller expects. It's the plug converter of design patterns, and it's how you keep a third-party
        library's interface from leaking through your whole codebase.
      </p>

      <CodeBlock language="text" filename="the problem" code={problem} />

      <h2>An adapter</h2>
      <CodeBlock language="java" filename="StripeAdapter.java" code={adapter} />
      <p>
        The adapter <strong>implements the interface your code wants</strong> and <strong>holds the object you
        actually have</strong> (the "adaptee"). Its methods translate: convert the arguments into the adaptee's
        vocabulary, call it, and convert the result back. Your code depends only on <code>PaymentProcessor</code>,
        so swapping payment providers is one new adapter rather than a codebase-wide change.
      </p>

      <AnalogyCard title="A travel plug adapter.">
        Your laptop charger has one shape of plug; the hotel wall has another. You don't rewire the charger or the
        building — you slot in an adapter that fits both, translating one interface to the other. It adds no
        electricity and no features; it just makes two things that couldn't connect, connect.
      </AnalogyCard>

      <h2>Adapters in the JDK</h2>
      <CodeBlock language="java" filename="you already use these" code={jdk} />
      <Callout variant="info" title="Two flavours: object and class adapter">
        The version above is an <strong>object adapter</strong> — it holds the adaptee as a field and delegates,
        which is the flexible, composition-based form you'll almost always want. A <strong>class adapter</strong>{" "}
        instead extends the adaptee and implements the target interface, using inheritance — rarely used in Java
        because it burns the single superclass slot and couples you to the adaptee's implementation.
      </Callout>

      <h2>Adapter versus Decorator</h2>
      <CodeBlock language="text" filename="both wrap — the difference is the interface" code={adapterVsDecorator} />

      <CommonMistake
        title="letting a third-party type spread through your codebase"
        wrong={`// StripeCharge used directly in a hundred places
public void handleWebhook(StripeCharge charge) { ... }
public Receipt receiptFor(StripeCharge charge) { ... }
private void audit(StripeCharge charge) { ... }

// Switch payment provider and every one of these signatures changes.
// The library's interface has become your interface.`}
        right={`// Adapt at the boundary; your domain speaks its own language
public void handleWebhook(Payment payment) { ... }   // your type
public Receipt receiptFor(Payment payment) { ... }

// One adapter converts StripeCharge -> Payment at the edge:
Payment payment = stripeAdapter.toPayment(charge);
// The provider is now swappable behind a single class.`}
        explanation={
          <p>
            An adapter is most valuable as a boundary. If a third-party type appears throughout your code, you've
            coupled your entire application to that library's interface, and replacing it is a rewrite. Adapt once,
            at the edge, into your own domain types — then the rest of the codebase never knows which provider is
            behind the adapter, and switching is a single new class.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            Adapter connects two things that don't fit. Your code expects one shape of method; a library gives
            another. Rather than change either, you write a small in-between class that presents the shape your code
            wants and forwards the calls to the library, translating as it goes.
          </p>
        }
        developer={
          <p>
            The object adapter implements the target interface and composes the adaptee, translating each call; the
            class adapter uses inheritance instead and is rarely worth its coupling in Java. Its best use is
            isolating third-party or legacy code behind your own interface at a boundary, so the external API can be
            swapped without rippling through the codebase. <code>Arrays.asList</code>,{" "}
            <code>InputStreamReader</code> and <code>Collections.list</code> are JDK adapters.
          </p>
        }
        interview={
          <p>
            The question is usually Adapter versus Decorator versus Proxy — all wrap an object. Adapter{" "}
            <em>changes</em> the interface to make incompatible things fit; Decorator <em>keeps</em> the interface
            and adds behaviour; Proxy keeps the interface and controls access. Name a JDK adapter (
            <code>InputStreamReader</code>: bytes to chars) and the object-versus-class distinction, and mention the
            boundary use — adapt third-party types once at the edge so they don't leak everywhere.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="What distinguishes an Adapter from a Decorator?"
        options={[
          { id: "a", text: "An Adapter is always a singleton" },
          { id: "b", text: "An Adapter changes the interface to make incompatible things fit; a Decorator keeps the same interface and adds behaviour" },
          { id: "c", text: "A Decorator wraps an object but an Adapter does not" },
          { id: "d", text: "An Adapter can only wrap library classes" },
        ]}
        correctId="b"
        explanation="Both wrap an object; the difference is the interface. Adapter presents a DIFFERENT interface — translating between two incompatible ones. Decorator presents the SAME interface and adds behaviour, which is what lets decorators stack. Proxy also keeps the same interface, but to control access."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Adapt a mismatched API"
        hint={
          <p>
            Define the interface your code wants, then write a class that implements it and holds the mismatched
            object as a field, translating in each method.
          </p>
        }
      >
        Take an interface your code would like — say <code>Logger</code> with a <code>log(level, message)</code>{" "}
        method — and a class with a different shape, like one that only has <code>printError(String)</code> and{" "}
        <code>printInfo(String)</code>. Write an adapter so the mismatched class can be used through your{" "}
        <code>Logger</code> interface. Then note how you'd swap in a completely different logging library by writing
        one more adapter.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the Adapter pattern, and how does it differ from Decorator and Proxy?"
        answer={
          <p>
            Adapter wraps an object to present a <em>different</em> interface — the one the caller expects —
            translating calls between two otherwise incompatible types. The object-adapter form implements the
            target interface and holds the adaptee as a field, converting arguments and results in each method; the
            class-adapter form uses inheritance and is rarely worth its coupling in Java. Its best use is at a
            boundary: wrap a third-party or legacy API in your own interface once, so the external type doesn't
            spread through your codebase and the provider stays swappable. All three of Adapter, Decorator and Proxy
            wrap an object, and the distinction is what the wrapper presents. <strong>Adapter changes</strong> the
            interface to make incompatible things fit. <strong>Decorator keeps</strong> the same interface and adds
            behaviour, which is why decorators can stack. <strong>Proxy keeps</strong> the same interface too but
            controls access to the real object — lazy loading, security, remoting — rather than translating or
            enhancing. In the JDK, <code>InputStreamReader</code> adapts a byte stream to a character stream, and{" "}
            <code>Arrays.asList</code> adapts an array to a <code>List</code>.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "Adapter makes two incompatible interfaces work together by translating between them.",
          "It implements the interface your code wants and holds the object you actually have.",
          "Prefer the object adapter (composition) over the class adapter (inheritance) in Java.",
          "Use it at a boundary so third-party types don't leak through your whole codebase.",
          "Adapter changes the interface; Decorator keeps it and adds behaviour; Proxy keeps it and controls access.",
        ]}
      />
    </>
  )
}
