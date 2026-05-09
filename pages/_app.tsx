import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/react";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import "../styles/globals.css";
import { useEffect, useState } from "react";

function getSupabase(): SupabaseClient | null {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.NEXT_PUBLIC_SUPABASE_KEY;
	if (!url || !key) return null;
	return createClient(url, key);
}

function MyApp({ Component, pageProps }: AppProps) {
	const [views, setViews] = useState(0);

	useEffect(() => {
		let cancelled = false;

		async function syncViews() {
			const supabase = getSupabase();
			if (!supabase) return;

			const { data } = await supabase
				.from("views")
				.select("count")
				.limit(1)
				.single();

			if (!cancelled) {
				setViews(data?.count ?? 0);
			}

			if (process.env.NODE_ENV === "production" && !cancelled) {
				await supabase.rpc("increment", {
					slug_text: "/",
				});
			}
		}

		void syncViews();

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<>
			<Component {...pageProps} views={views} />
			<Analytics />
		</>
	);
}

export default MyApp;
