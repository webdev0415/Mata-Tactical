export function expressHandler(fn) {
    return async (req, res) => {
        try {
            const { status, result } = await fn(req);
            res.status(status || 200).json(result);
        } catch (err) {
            console.log('------------------Error Catching---------------', err);
            res.status(err.status || 500).json({ message: err.message || "Internal server error" });
        }
    };
}