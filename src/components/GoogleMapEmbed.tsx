
export default function GoogleMapEmbed() {
    return (
        <div className="w-full h-[80vh] rounded-lg overflow-hidden shadow-xl border border-border bg-muted relative">
            <iframe
                src="https://www.google.com/maps/d/u/0/embed?mid=12o-_NyQri8gq0pW09KzETCsq1ETRAZ4&ehbc=2E312F"
                width="100%"
                height="100%"
                className="absolute inset-0"
                title="Skate Map"
            ></iframe>
        </div>
    );
}
