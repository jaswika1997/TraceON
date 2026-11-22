
from pathlib import Path
from collections import defaultdict

import pandas as pd
import networkx as nx

from fastapi import APIRouter, HTTPException, Query

router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[3]

DATA_PATH = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "paysim_processed.parquet"
)

MAX_TRANSACTIONS = 100_000


def load_suspicious_transactions(limit=MAX_TRANSACTIONS):
    if not DATA_PATH.exists():
        raise FileNotFoundError("Processed PaySim dataset not found.")

    columns = [
        "nameOrig",
        "nameDest",
        "amount",
        "type",
        "step",
        "isFraud",
    ]

    df = pd.read_parquet(DATA_PATH, columns=columns)

    suspicious = df[df["isFraud"] == 1].copy()

    # Include a sample of legitimate transactions for context.
    legitimate = df[df["isFraud"] == 0].sample(
        n=min(limit, len(df[df["isFraud"] == 0])),
        random_state=42,
    )

    combined = pd.concat(
        [suspicious, legitimate],
        ignore_index=True,
    )

    return combined


def build_network(df):
    graph = nx.DiGraph()

    for row in df.itertuples(index=False):
        sender = row.nameOrig
        receiver = row.nameDest

        if not sender or not receiver:
            continue

        fraud = int(row.isFraud)

        if not graph.has_node(sender):
            graph.add_node(sender, fraud_transactions=0)

        if not graph.has_node(receiver):
            graph.add_node(receiver, fraud_transactions=0)

        if fraud:
            graph.nodes[sender]["fraud_transactions"] += 1
            graph.nodes[receiver]["fraud_transactions"] += 1

        if graph.has_edge(sender, receiver):
            graph[sender][receiver]["transaction_count"] += 1
            graph[sender][receiver]["total_amount"] += float(row.amount)
            graph[sender][receiver]["fraud_count"] += fraud
        else:
            graph.add_edge(
                sender,
                receiver,
                transaction_count=1,
                total_amount=float(row.amount),
                fraud_count=fraud,
            )

    return graph


def get_network_statistics(graph):
    fraud_nodes = [
        node
        for node, data in graph.nodes(data=True)
        if data["fraud_transactions"] > 0
    ]

    fraud_edges = [
        (source, target)
        for source, target, data in graph.edges(data=True)
        if data["fraud_count"] > 0
    ]

    undirected = graph.to_undirected()

    components = list(nx.connected_components(undirected))

    suspicious_components = [
        component
        for component in components
        if any(
            graph.nodes[node]["fraud_transactions"] > 0
            for node in component
        )
    ]

    return {
        "total_accounts": graph.number_of_nodes(),
        "total_connections": graph.number_of_edges(),
        "suspicious_accounts": len(fraud_nodes),
        "suspicious_connections": len(fraud_edges),
        "total_clusters": len(components),
        "suspicious_clusters": len(suspicious_components),
    }


@router.get("/overview")
def intelligence_overview():
    try:
        df = load_suspicious_transactions()
        graph = build_network(df)

        return {
            "success": True,
            "statistics": get_network_statistics(graph),
            "transactions_analyzed": len(df),
            "fraud_transactions_in_sample": int(df["isFraud"].sum()),
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@router.get("/network")
def get_network(
    limit: int = Query(default=100, ge=10, le=500)
):
    try:
        df = load_suspicious_transactions()
        graph = build_network(df)

        # Rank accounts by number of fraud-labelled transactions.
        ranked_nodes = sorted(
            graph.nodes(data=True),
            key=lambda item: item[1]["fraud_transactions"],
            reverse=True,
        )

        selected_ids = {
            node for node, _ in ranked_nodes[:limit]
        }

        # Include directly connected accounts for context.
        for node in list(selected_ids):
            selected_ids.update(graph.predecessors(node))
            selected_ids.update(graph.successors(node))

        nodes = []

        for node in selected_ids:
            data = graph.nodes[node]

            nodes.append({
                "id": node,
                "label": node,
                "fraud_transactions": data["fraud_transactions"],
                "suspicious": data["fraud_transactions"] > 0,
            })

        edges = []

        for source, target, data in graph.edges(data=True):
            if source not in selected_ids or target not in selected_ids:
                continue

            edges.append({
                "id": f"{source}-{target}",
                "source": source,
                "target": target,
                "transaction_count": data["transaction_count"],
                "total_amount": round(data["total_amount"], 2),
                "fraud_count": data["fraud_count"],
                "suspicious": data["fraud_count"] > 0,
            })

        return {
            "success": True,
            "nodes": nodes,
            "edges": edges,
            "node_count": len(nodes),
            "edge_count": len(edges),
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
