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
import { UserCheck, ArrowRight, Server, ShieldCheck, ClipboardList } from "lucide-react"

const problem = `// The problem: you want to add access control, laziness, caching or
// logging AROUND an object, without changing the object or its callers.

interface ImageService {
    Image load(String path);
}
class RealImageService implements ImageService {
    public Image load(String path) { /* slow: reads from disk */ }
}

// Proxy (structural): a stand-in with the SAME interface as the real
// object, which callers use instead — and which decides when and
// whether to touch the real one.`

const proxy = `class CachingImageProxy implements ImageService {   // same interface
    private final ImageService real;                 // holds the real subject
    private final Map<String, Image> cache = new ConcurrentHashMap<>();

    CachingImageProxy(ImageService real) { this.real = real; }

    @Override
    public Image load(String path) {
        return cache.computeIfAbsent(path, real::load);   // control access:
    }                                                     // only hit disk once
}

// Callers can't tell the difference — same interface
ImageService service = new CachingImageProxy(new RealImageService());
service.load("a.png");     // slow: delegates to the real one, caches
service.load("a.png");     // fast: served from the proxy's cache`

const kinds = `Virtual proxy    defers creating the expensive real object until first use
                 (lazy loading — Hibernate does this for entity relations)

Protection proxy checks permissions before delegating
                 (only an admin may reach the real service)

Remote proxy     stands in for an object on another machine, hiding the
                 network call (RMI, gRPC stubs)

Caching proxy    remembers results and skips repeat work

Logging proxy    records calls before/after delegating`

const dynamicProxy = `// Java's built-in dynamic proxy: create a proxy at RUNTIME for any interface
ImageService service = (ImageService) Proxy.newProxyInstance(
    ImageService.class.getClassLoader(),
    new Class<?>[] { ImageService.class },
    (proxy, method, args) -> {
        System.out.println("calling " + method.getName());
        Object result = method.invoke(real, args);       // delegate to the real one
        System.out.println("returned");
        return result;
    });

// One InvocationHandler can wrap ANY interface — no hand-written proxy class.
// This is the machinery behind Spring AOP, @Transactional, and mocking
// libraries. (For classes rather than interfaces, Spring uses CGLIB subclassing.)`

const springAop = `// Why 'self-invocation' doesn't trigger @Transactional
@Service
class OrderService {
    @Transactional
    public void placeOrder(Order o) { ... }

    public void batch(List<Order> orders) {
        for (Order o : orders) {
            placeOrder(o);      // BUG: calls THIS, bypassing the proxy —
        }                       // no transaction is started
    }
}
// The annotation works via a proxy that wraps the bean. A call from
// inside the bean to itself never goes through the proxy, so the
// interceptor never runs. This is the #1 Spring proxy gotcha.`

export default function ProxyPatternLesson() {
  return (
    <>
      <p>
        A Proxy is a stand-in that has the same interface as a real object and controls access to it — deciding
        when to create it, whether the caller is allowed, whether a cached answer will do. It's the mechanism behind
        Spring's <code>@Transactional</code>, Hibernate's lazy loading, and every mocking library, so understanding
        it explains a lot of "magic".
      </p>

      <CodeBlock language="text" filename="the problem" code={problem} />

      <h2>A proxy</h2>
      <CodeBlock language="java" filename="a caching proxy" code={proxy} />
      <p>
        Like Decorator and Adapter, a proxy wraps an object — but its job is <strong>controlling access</strong>,
        not adding features or translating. It shares the real object's interface so callers can't tell they're
        talking to a stand-in, and it decides when (or whether) to pass the call through.
      </p>

      <h2>How a call flows through a protection proxy</h2>
      <StepFlowDiagram
        title="service.load(path) via a protection proxy"
        steps={[
          {
            id: "call",
            label: "Caller uses the proxy",
            detail: "The caller holds an ImageService and calls load(path). It's actually the proxy — same interface, so the caller is none the wiser.",
            icon: ArrowRight,
          },
          {
            id: "check",
            label: "Proxy applies its policy",
            detail: "Before delegating, the proxy does its job: check the caller's permission, look in a cache, start a transaction, log the call — whatever this proxy is for.",
            icon: ShieldCheck,
            tone: "warning",
          },
          {
            id: "decide",
            label: "Allow, or don't",
            detail: "If the policy fails — no permission, cache hit — the proxy may throw, or return early without ever touching the real object. That's the 'control access' part.",
            icon: UserCheck,
          },
          {
            id: "delegate",
            label: "Delegate to the real subject",
            detail: "If all is well, the proxy calls the real object, possibly creating it lazily right now if this is its first use.",
            icon: Server,
          },
          {
            id: "post",
            label: "Post-process and return",
            detail: "The proxy can act on the result too — cache it, log it, commit the transaction — then hand it back. The caller sees a normal return.",
            icon: ClipboardList,
            tone: "success",
          },
        ]}
      />

      <h2>Kinds of proxy</h2>
      <CodeBlock language="text" filename="what the access control is for" code={kinds} />

      <AnalogyCard title="A personal assistant who screens calls.">
        You don't reach the executive directly — the assistant takes the call, checks whether you're on the list,
        maybe answers a routine question from memory without disturbing them, and only puts serious matters through.
        Same phone number, same apparent person; a layer that decides what actually reaches the real one. That's a
        proxy: access control wearing the same interface.
      </AnalogyCard>

      <h2>Dynamic proxies</h2>
      <CodeBlock language="java" filename="java.lang.reflect.Proxy" code={dynamicProxy} />
      <Callout variant="info" title="This is how the frameworks do it">
        Spring, mocking libraries (Mockito), and ORMs don't hand-write a proxy class per interface — they generate
        one at runtime. <code>java.lang.reflect.Proxy</code> creates a proxy for any interface and routes every
        method through a single <code>InvocationHandler</code>. For proxying <em>classes</em> rather than
        interfaces, they use bytecode subclassing (CGLIB / ByteBuddy). Either way, the pattern is the same: a
        same-interface stand-in that intercepts calls.
      </Callout>

      <h2>The Spring self-invocation gotcha</h2>
      <CodeBlock language="java" filename="why the annotation silently doesn't fire" code={springAop} />

      <CommonMistake
        title="expecting a proxy-based annotation to work on an internal call"
        wrong={`@Service
class ReportService {
    @Cacheable("reports")
    public Report get(String id) { ... }

    public List<Report> getMany(List<String> ids) {
        return ids.stream().map(this::get).toList();
        //                          ^ 'this' is the real bean, not the proxy —
        //                            @Cacheable never fires for these calls
    }
}`}
        right={`// Move the cached method to another bean, so the call crosses the proxy:
@Service
class ReportService {
    private final ReportFetcher fetcher;   // separate bean = separate proxy
    public List<Report> getMany(List<String> ids) {
        return ids.stream().map(fetcher::get).toList();   // goes through the proxy
    }
}
@Service class ReportFetcher {
    @Cacheable("reports")
    public Report get(String id) { ... }
}`}
        explanation={
          <p>
            Spring's <code>@Transactional</code>, <code>@Cacheable</code>, <code>@Async</code> and friends work by
            wrapping the bean in a proxy. Only calls that arrive <em>through</em> the proxy trigger the behaviour; a
            call from a method of the bean to another method of the same bean (<code>this.method()</code>) bypasses
            it entirely. The fix is to make the annotated call cross a proxy boundary — usually by putting the
            annotated method in a separate bean. This is the single most common Spring surprise, and it's pure
            Proxy-pattern mechanics.
          </p>
        }
      />

      <DifficultyLevels
        simple={
          <p>
            A proxy is a stand-in for another object, with the same set of methods. Callers use the proxy thinking
            it's the real thing, and the proxy decides what to do — check if you're allowed, return a saved answer,
            create the real object only now that it's actually needed — before (or instead of) passing the call
            along.
          </p>
        }
        developer={
          <p>
            A proxy implements the subject's interface and holds (or lazily creates) the real subject, interposing
            on every call to add access control: virtual (lazy init), protection (authorization), remote (hide the
            network), caching, logging. Java's <code>java.lang.reflect.Proxy</code> generates proxies for interfaces
            at runtime via an <code>InvocationHandler</code>; CGLIB/ByteBuddy subclass concrete classes. This is the
            backbone of Spring AOP and declarative <code>@Transactional</code>/<code>@Cacheable</code>, and the
            reason self-invocation bypasses those annotations.
          </p>
        }
        interview={
          <p>
            Distinguish it from the other wrappers: Proxy keeps the same interface but <em>controls access</em>,
            Decorator keeps the interface and <em>adds behaviour</em>, Adapter <em>changes</em> the interface. Name
            the kinds (virtual, protection, remote), and — the answer that lands — explain that Spring's AOP
            annotations are proxies, which is why an internal <code>this.method()</code> call silently skips{" "}
            <code>@Transactional</code>. Mentioning dynamic proxies versus CGLIB shows you know how the frameworks
            implement it.
          </p>
        }
      />

      <h2>Quick quiz</h2>
      <Quiz
        question="Why does calling one @Transactional method from another method of the same Spring bean skip the transaction?"
        options={[
          { id: "a", text: "Transactions can't be nested" },
          { id: "b", text: "The annotation works via a proxy, and an internal this.method() call doesn't go through the proxy, so the interceptor never runs" },
          { id: "c", text: "The second method needs its own @Transactional" },
          { id: "d", text: "Spring disables transactions inside loops" },
        ]}
        correctId="b"
        explanation="Spring wraps the bean in a proxy that starts the transaction. Only calls arriving through the proxy trigger it; a call from the bean to itself (this.method()) targets the real object directly and bypasses the proxy, so no transaction begins. Moving the annotated method to a separate bean makes the call cross the proxy."
      />

      <h2>Mini challenge</h2>
      <Challenge
        title="Write a lazy-loading proxy"
        hint={
          <p>
            The proxy holds a <code>null</code> reference to the real object and creates it inside the method on
            first call, caching it for later.
          </p>
        }
      >
        Implement a <code>virtual proxy</code> for an expensive-to-create object: the proxy shares the interface but
        doesn't build the real object until a method is first called, then reuses it. Prove with a print statement
        that the real object isn't constructed until needed. Then, for bonus, use{" "}
        <code>java.lang.reflect.Proxy</code> to log every method call to any interface without writing a proxy class
        by hand.
      </Challenge>

      <h2>Interview question</h2>
      <InterviewQuestion
        question="What is the Proxy pattern, and how is it used in frameworks like Spring?"
        answer={
          <p>
            A proxy is a stand-in object that implements the same interface as a real subject and controls access to
            it. Callers use the proxy as if it were the real thing, and the proxy decides what happens on each call —
            create the real object lazily (virtual proxy), check permissions first (protection proxy), hide a
            network hop (remote proxy), serve a cached result, or log. It differs from the other wrappers by intent:
            Decorator adds behaviour and keeps the interface, Adapter changes the interface, and Proxy keeps the
            interface but governs access. Frameworks lean on it heavily. Spring implements declarative concerns like{" "}
            <code>@Transactional</code>, <code>@Cacheable</code>, <code>@Async</code> and security by wrapping your
            bean in a proxy that runs the cross-cutting logic around your method — that's what AOP <em>is</em>. It
            generates these at runtime: <code>java.lang.reflect.Proxy</code> with an{" "}
            <code>InvocationHandler</code> for interfaces, or CGLIB/ByteBuddy subclassing for concrete classes.
            Hibernate uses virtual proxies for lazy-loaded associations, and mocking libraries proxy interfaces to
            record and stub calls. The most famous consequence is the self-invocation trap: because the behaviour
            lives in the proxy, a call from a bean to another of its own methods (<code>this.method()</code>) doesn't
            pass through the proxy, so <code>@Transactional</code> silently doesn't apply — which you fix by moving
            the annotated method into a separate bean so the call crosses the proxy boundary.
          </p>
        }
      />

      <KeyTakeaways
        items={[
          "A proxy is a same-interface stand-in that controls access to a real object.",
          "Kinds: virtual (lazy), protection (authorization), remote (network), caching, logging.",
          "Decorator adds behaviour, Adapter changes the interface, Proxy controls access — all wrap an object.",
          "java.lang.reflect.Proxy generates interface proxies at runtime; CGLIB subclasses concrete classes.",
          "Spring's @Transactional/@Cacheable are proxies — which is why an internal this.method() call skips them.",
        ]}
      />
    </>
  )
}
