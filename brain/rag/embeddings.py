"""
Prime PenTrix - OpenAI Embeddings Client
=========================================
Generates text embeddings via OpenAI API (text-embedding-3-small).
Uses httpx for async HTTP calls. No local models needed.

Cost: ~$0.02 per 1M tokens (~$0.10/month typical usage)
Dimensions: 1536 (high quality)
"""

import logging
from typing import List, Optional

import httpx

from config import settings

logger = logging.getLogger(__name__)

# ── Module-level cache for query embeddings ─────────────────
_embedding_cache: dict = {}
_MAX_CACHE_SIZE = 500


class EmbeddingClient:
    """
    OpenAI API embedding client.

    Usage:
        client = EmbeddingClient()
        embedding = await client.embed_text("What is a subnet?")
        embeddings = await client.embed_batch(["text1", "text2"])
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "text-embedding-3-small",
        dimensions: int = 1536,
        base_url: str = "https://api.openai.com/v1",
    ):
        self.api_key = api_key or settings.openai_api_key
        self.model = model
        self.dimensions = dimensions
        self.base_url = base_url
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        """Get or create async HTTP client."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                timeout=30.0,
            )
        return self._client

    async def close(self) -> None:
        """Close the HTTP client."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()
            self._client = None

    @property
    def is_configured(self) -> bool:
        """Check if API key is set."""
        return bool(self.api_key and self.api_key.strip())

    # ── Single Text Embedding ───────────────────────────────

    async def embed_text(
        self,
        text: str,
        use_cache: bool = True,
    ) -> Optional[List[float]]:
        """
        Generate embedding for a single text.
        Uses cache for repeated queries.

        Returns:
            List of floats (1536 dimensions) or None if API unavailable.
        """
        if not self.is_configured:
            logger.warning("OpenAI API key not configured, skipping embedding")
            return None

        # Check cache
        if use_cache and text in _embedding_cache:
            return _embedding_cache[text]

        try:
            client = await self._get_client()
            response = await client.post(
                "/embeddings",
                json={
                    "input": text,
                    "model": self.model,
                    "dimensions": self.dimensions,
                },
            )
            response.raise_for_status()
            data = response.json()

            embedding = data["data"][0]["embedding"]

            # Cache the result
            if use_cache:
                if len(_embedding_cache) >= _MAX_CACHE_SIZE:
                    # Evict oldest entries (simple FIFO)
                    keys = list(_embedding_cache.keys())
                    for k in keys[: _MAX_CACHE_SIZE // 4]:
                        del _embedding_cache[k]
                _embedding_cache[text] = embedding

            return embedding

        except httpx.HTTPStatusError as e:
            logger.error(
                f"OpenAI API error {e.response.status_code}: "
                f"{e.response.text[:200]}"
            )
            return None
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            return None

    # ── Batch Embedding ─────────────────────────────────────

    async def embed_batch(
        self,
        texts: List[str],
        batch_size: int = 100,
    ) -> List[Optional[List[float]]]:
        """
        Generate embeddings for multiple texts.
        Processes in batches of 100 (OpenAI limit: 2048).

        Returns:
            List of embeddings (same order as input).
            None for any text that failed.
        """
        if not self.is_configured:
            logger.warning("OpenAI API key not configured, returning None embeddings")
            return [None] * len(texts)

        all_embeddings: List[Optional[List[float]]] = [None] * len(texts)

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]

            try:
                client = await self._get_client()
                response = await client.post(
                    "/embeddings",
                    json={
                        "input": batch,
                        "model": self.model,
                        "dimensions": self.dimensions,
                    },
                )
                response.raise_for_status()
                data = response.json()

                # OpenAI returns embeddings sorted by index
                for item in data["data"]:
                    idx = item["index"]
                    all_embeddings[i + idx] = item["embedding"]

                tokens_used = data.get("usage", {}).get("total_tokens", 0)
                logger.info(
                    f"  Embedded batch {i // batch_size + 1}: "
                    f"{len(batch)} texts, {tokens_used} tokens"
                )

            except httpx.HTTPStatusError as e:
                logger.error(
                    f"OpenAI batch error {e.response.status_code}: "
                    f"{e.response.text[:200]}"
                )
                # Leave None for this batch
            except Exception as e:
                logger.error(f"Batch embedding failed: {e}")

        return all_embeddings

    def __repr__(self) -> str:
        configured = "configured" if self.is_configured else "NOT configured"
        return (
            f"EmbeddingClient(model={self.model}, "
            f"dims={self.dimensions}, {configured})"
        )


# ── Module-level singleton ──────────────────────────────────

_embedding_client: Optional[EmbeddingClient] = None


def get_embedding_client() -> EmbeddingClient:
    """Get or create the embedding client singleton."""
    global _embedding_client
    if _embedding_client is None:
        _embedding_client = EmbeddingClient(
            api_key=settings.openai_api_key,
            model=settings.openai_embedding_model,
            dimensions=settings.openai_embedding_dim,
        )
    return _embedding_client
