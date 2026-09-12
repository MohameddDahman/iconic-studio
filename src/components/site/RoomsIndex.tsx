import SplitHeading from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import PairedImage from "./PairedImage";
import { cn } from "@/lib/utils";
import type { Threshold } from "@/lib/types";

/** Every room of the house, with its ceiling height and the one idea behind it. */
export default function RoomsIndex({ rooms }: { rooms: Threshold[] }) {
  return (
    <section data-surface="night" className="bg-surface py-[var(--spacing-bay-lg)] text-on-surface">
      <div className="sheet">
        <div className="grid gap-10 border-b border-rule pb-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-8 text-accent">Room by room</p>
            <SplitHeading className="inked text-d2 leading-[0.95] tracking-[-0.02em]">
              {rooms.length} rooms, by day <em>and after dark.</em>
            </SplitHeading>
          </div>
          <p className="max-w-md text-on-surface-muted lg:col-span-4 lg:col-start-9">
            Where a room was rendered twice, the lamp on its photograph switches between daylight
            and evening.
          </p>
        </div>

        <ol className="mt-16 grid gap-x-8 gap-y-16 md:grid-cols-2">
          {rooms.map((room, i) => {
            const wide = i % 3 === 0;
            return (
              <Reveal as="li" key={room.id} className={cn(wide && "md:col-span-2")}>
                <figure>
                  <div className={cn("relative overflow-hidden bg-umber", wide ? "aspect-[16/9]" : "aspect-[4/3]")}>
                    <PairedImage
                      media={room.media}
                      sizes={wide ? "100vw" : "(min-width: 768px) 50vw, 100vw"}
                      lamp={{ x: 50, y: 6 }}
                    />
                  </div>
                  <figcaption className="mt-5 grid gap-3 md:grid-cols-[4rem_1fr_auto] md:gap-6">
                    <span className="annotation pt-2 text-accent">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="inked text-d4 leading-none">{room.room}</h3>
                      <p className="mt-3 max-w-xl text-on-surface-muted">{room.note}</p>
                    </div>
                    <span className="annotation pt-2 text-on-surface-faint">Ceiling {room.ceiling}</span>
                  </figcaption>
                </figure>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
